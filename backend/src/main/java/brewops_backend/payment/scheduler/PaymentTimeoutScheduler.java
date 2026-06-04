package brewops_backend.payment.scheduler;

import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderStatus;
import brewops_backend.order.repository.OrderRepository;
import brewops_backend.payment.entity.Payment;
import brewops_backend.payment.repository.PaymentRepository;
import brewops_backend.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class PaymentTimeoutScheduler {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    @Value("${brewops.payment.timeout-minutes:30}")
    private int timeoutMinutes;

    @Scheduled(fixedDelayString = "${brewops.payment.timeout-check-interval-ms:60000}")
    @Transactional
    public void expireAbandonedPayments() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(timeoutMinutes);
        List<Order> staleOrders = orderRepository.findByStatusAndUpdatedAtBefore(
                OrderStatus.PAYMENT_PENDING, cutoff
        );

        for (Order order : staleOrders) {
            paymentRepository.findByOrder_Id(order.getId()).ifPresent(payment -> {
                log.info("Expiring abandoned payment {} for order {}", payment.getId(), order.getId());
                paymentService.failPayment(payment.getId(), "PAYMENT_TIMEOUT");
            });
        }
    }
}
