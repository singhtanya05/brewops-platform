package brewops_backend.payment;

import brewops_backend.catalog.dto.MenuCategoryResponse;
import brewops_backend.catalog.dto.MenuVariantResponse;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.repository.InventoryRepository;
import brewops_backend.order.dto.AddCartItemRequest;
import brewops_backend.order.dto.CreateOrderRequest;
import brewops_backend.order.dto.OrderResponse;
import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderStatus;
import brewops_backend.order.repository.OrderRepository;
import brewops_backend.payment.dto.CreatePaymentRequest;
import brewops_backend.payment.dto.PaymentResponse;
import brewops_backend.payment.entity.Payment;
import brewops_backend.payment.entity.PaymentStatus;
import brewops_backend.payment.repository.PaymentRepository;
import brewops_backend.payment.scheduler.PaymentTimeoutScheduler;
import brewops_backend.payment.service.PaymentService;
import brewops_backend.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentTimeoutIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentTimeoutScheduler paymentTimeoutScheduler;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void expireAbandonedPayments_cancelsStalePendingOrderAndReleasesInventory() {
        UUID variantId = fetchFirstAvailableVariantId();
        String sessionId = "timeout-pending-" + UUID.randomUUID();

        Inventory before = inventoryRepository.findByVariantId(variantId).orElseThrow();
        int availableBefore = before.getAvailableQuantity();
        int reservedBefore = before.getReservedQuantity();

        // 1. Add item and checkout to create PENDING order (reserves stock)
        restTemplate.postForEntity(
                "/api/v1/cart/items",
                new AddCartItemRequest(sessionId, variantId, 1, null),
                Void.class
        );

        ResponseEntity<OrderResponse> orderResponse = restTemplate.postForEntity(
                "/api/v1/orders",
                new CreateOrderRequest(sessionId),
                OrderResponse.class
        );
        assertThat(orderResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        UUID orderId = orderResponse.getBody().orderId();

        // Assert stock reserved
        Inventory afterCheckout = inventoryRepository.findByVariantId(variantId).orElseThrow();
        assertThat(afterCheckout.getAvailableQuantity()).isEqualTo(availableBefore - 1);
        assertThat(afterCheckout.getReservedQuantity()).isEqualTo(reservedBefore + 1);

        // 2. Backdate the order to make it stale (e.g. 35 minutes ago)
        backdateOrder(orderId, 35);

        // 3. Trigger scheduler manually
        paymentTimeoutScheduler.expireAbandonedPayments();

        // 4. Verify order is CANCELLED and stock released
        Order expiredOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(expiredOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);

        Inventory afterTimeout = inventoryRepository.findByVariantId(variantId).orElseThrow();
        assertThat(afterTimeout.getAvailableQuantity()).isEqualTo(availableBefore);
        assertThat(afterTimeout.getReservedQuantity()).isEqualTo(reservedBefore);
    }

    @Test
    void expireAbandonedPayments_failsStalePaymentPendingOrderAndReleasesInventory() {
        UUID variantId = fetchFirstAvailableVariantId();
        String sessionId = "timeout-pay-pending-" + UUID.randomUUID();

        Inventory before = inventoryRepository.findByVariantId(variantId).orElseThrow();
        int availableBefore = before.getAvailableQuantity();
        int reservedBefore = before.getReservedQuantity();

        // 1. Checkout
        restTemplate.postForEntity(
                "/api/v1/cart/items",
                new AddCartItemRequest(sessionId, variantId, 1, null),
                Void.class
        );

        ResponseEntity<OrderResponse> orderResponse = restTemplate.postForEntity(
                "/api/v1/orders",
                new CreateOrderRequest(sessionId),
                OrderResponse.class
        );
        UUID orderId = orderResponse.getBody().orderId();

        // 2. Initiate payment (transitions order to PAYMENT_PENDING)
        PaymentResponse payment = paymentService.createPayment(
                new CreatePaymentRequest(orderId, "idem-timeout-" + UUID.randomUUID())
        );

        // Assert status
        Order orderAfterPayment = orderRepository.findById(orderId).orElseThrow();
        assertThat(orderAfterPayment.getStatus()).isEqualTo(OrderStatus.PAYMENT_PENDING);

        // 3. Backdate order
        backdateOrder(orderId, 35);

        // 4. Trigger scheduler
        paymentTimeoutScheduler.expireAbandonedPayments();

        // 5. Verify order is FAILED, payment is FAILED, and stock released
        Order expiredOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(expiredOrder.getStatus()).isEqualTo(OrderStatus.FAILED);

        Payment expiredPayment = paymentRepository.findById(payment.paymentId()).orElseThrow();
        assertThat(expiredPayment.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(expiredPayment.getFailureReason()).isEqualTo("PAYMENT_TIMEOUT");

        Inventory afterTimeout = inventoryRepository.findByVariantId(variantId).orElseThrow();
        assertThat(afterTimeout.getAvailableQuantity()).isEqualTo(availableBefore);
        assertThat(afterTimeout.getReservedQuantity()).isEqualTo(reservedBefore);
    }

    private void backdateOrder(UUID orderId, int minutes) {
        jdbcTemplate.update(
                "UPDATE orders SET updated_at = ? WHERE id = ?",
                LocalDateTime.now().minusMinutes(minutes),
                orderId
        );
    }

    private UUID fetchFirstAvailableVariantId() {
        ResponseEntity<List<MenuCategoryResponse>> menuResponse = restTemplate.exchange(
                "/api/v1/menu",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );
        assertThat(menuResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        MenuVariantResponse variant = menuResponse.getBody().stream()
                .flatMap(category -> category.products().stream())
                .flatMap(product -> product.variants().stream())
                .filter(v -> v.availableQuantity() > 0)
                .findFirst()
                .orElseThrow();

        return variant.variantId();
    }
}
