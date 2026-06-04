package brewops_backend.payment.service;

import brewops_backend.inventory.service.InventoryService;
import brewops_backend.payment.client.StripePaymentClient;
import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderStatus;
import brewops_backend.order.repository.OrderRepository;
import brewops_backend.order.service.OrderLifecycleService;
import brewops_backend.payment.dto.CreatePaymentRequest;
import brewops_backend.payment.dto.PaymentResponse;
import brewops_backend.payment.entity.Payment;
import brewops_backend.payment.entity.PaymentProvider;
import brewops_backend.payment.entity.PaymentStatus;
import brewops_backend.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Set<PaymentStatus> COMPLETABLE = EnumSet.of(
            PaymentStatus.INITIATED, PaymentStatus.PENDING
    );

    private static final Set<PaymentStatus> FAILABLE = EnumSet.of(
            PaymentStatus.INITIATED, PaymentStatus.PENDING
    );

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderLifecycleService orderLifecycleService;
    private final InventoryService inventoryService;
    private final IdempotencyService idempotencyService;
    private final StripePaymentClient stripePaymentClient;

    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        String requestHash = idempotencyService.hashRequest(request.orderId(), request.idempotencyKey());

        return idempotencyService.findExisting(request.idempotencyKey(), requestHash)
                .or(() -> paymentRepository.findByIdempotencyKey(request.idempotencyKey())
                        .map(this::mapPayment))
                .orElseGet(() -> {
                    PaymentResponse response = createNewPayment(request);
                    idempotencyService.store(request.idempotencyKey(), requestHash, response);
                    return response;
                });
    }

    private PaymentResponse createNewPayment(CreatePaymentRequest request) {
        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (paymentRepository.existsByOrder_Id(order.getId())) {
            throw new IllegalArgumentException("Payment already exists for this order");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Payment can only be initiated for PENDING orders");
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setProvider(PaymentProvider.STRIPE);
        payment.setStatus(PaymentStatus.INITIATED);
        payment.setAmount(order.getTotalAmount());
        payment.setCurrency(order.getCurrency());
        payment.setIdempotencyKey(request.idempotencyKey());

        orderLifecycleService.transition(order, OrderStatus.PAYMENT_PENDING, "Payment initiated");

        Payment savedPayment = paymentRepository.save(payment);
        stripePaymentClient.createPaymentIntent(savedPayment);
        savedPayment.setStatus(PaymentStatus.PENDING);
        savedPayment = paymentRepository.save(savedPayment);

        return mapPayment(savedPayment);
    }

    @Transactional
    public PaymentResponse completePayment(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return mapPayment(payment);
        }

        if (!COMPLETABLE.contains(payment.getStatus())) {
            throw new IllegalArgumentException("Payment cannot be completed in status: " + payment.getStatus());
        }

        Order order = payment.getOrder();

        inventoryService.commitForOrder(order);
        orderLifecycleService.transition(order, OrderStatus.PAID, "Payment successful");

        payment.setStatus(PaymentStatus.SUCCESS);
        Payment saved = paymentRepository.save(payment);

        return mapPayment(saved);
    }

    @Transactional
    public PaymentResponse failPayment(UUID paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.FAILED) {
            return mapPayment(payment);
        }

        if (!FAILABLE.contains(payment.getStatus())) {
            throw new IllegalArgumentException("Payment cannot be failed in status: " + payment.getStatus());
        }

        Order order = payment.getOrder();

        if (order.getStatus() == OrderStatus.PAYMENT_PENDING) {
            inventoryService.releaseForOrder(order);
            orderLifecycleService.transition(order, OrderStatus.FAILED, reason);
        }

        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        Payment saved = paymentRepository.save(payment);

        return mapPayment(saved);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        return mapPayment(payment);
    }

    @Transactional
    public PaymentResponse refundPayment(UUID paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            return mapPayment(payment);
        }

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new IllegalArgumentException("Only successful payments can be refunded");
        }

        Order order = payment.getOrder();

        stripePaymentClient.refund(payment);

        inventoryService.restockForOrder(order, "Refund: " + reason);

        orderLifecycleService.transition(order, OrderStatus.REFUNDED, reason);
        payment.setStatus(PaymentStatus.REFUNDED);
        Payment saved = paymentRepository.save(payment);

        return mapPayment(saved);
    }

    private PaymentResponse mapPayment(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getProvider().name(),
                payment.getStatus().name(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getIdempotencyKey(),
                payment.getProviderPaymentIntentId(),
                payment.getClientSecret()
        );
    }
}
