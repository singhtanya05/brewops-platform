package brewops_backend.order;

import brewops_backend.catalog.dto.MenuCategoryResponse;
import brewops_backend.catalog.dto.MenuVariantResponse;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.repository.InventoryRepository;
import brewops_backend.order.dto.AddCartItemRequest;
import brewops_backend.order.dto.CreateOrderRequest;
import brewops_backend.order.dto.OrderResponse;
import brewops_backend.order.entity.OrderStatus;
import brewops_backend.order.repository.OrderRepository;
import brewops_backend.payment.dto.CreatePaymentRequest;
import brewops_backend.payment.dto.PaymentResponse;
import brewops_backend.payment.entity.PaymentStatus;
import brewops_backend.common.exception.InvalidOrderStateException;
import brewops_backend.order.entity.Order;
import brewops_backend.order.service.OrderLifecycleService;
import brewops_backend.payment.service.PaymentService;
import brewops_backend.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class OrderPaymentFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private OrderLifecycleService orderLifecycleService;

    @Test
    void completePayment_commitsInventoryAndMarksOrderPaid() {
        UUID variantId = fetchFirstAvailableVariantId();
        String sessionId = "test-session-" + UUID.randomUUID();

        Inventory before = inventoryRepository.findByVariantId(variantId).orElseThrow();
        int availableBefore = before.getAvailableQuantity();
        int reservedBefore = before.getReservedQuantity();

        restTemplate.postForEntity(
                "/api/v1/cart/items",
                new AddCartItemRequest(sessionId, variantId, 1),
                Void.class
        );

        ResponseEntity<OrderResponse> orderResponse = restTemplate.postForEntity(
                "/api/v1/orders",
                new CreateOrderRequest(sessionId),
                OrderResponse.class
        );
        assertThat(orderResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        UUID orderId = orderResponse.getBody().orderId();

        PaymentResponse payment = paymentService.createPayment(
                new CreatePaymentRequest(orderId, "idem-" + UUID.randomUUID())
        );

        Inventory afterReserve = inventoryRepository.findByVariantId(variantId).orElseThrow();
        assertThat(afterReserve.getAvailableQuantity()).isEqualTo(availableBefore - 1);
        assertThat(afterReserve.getReservedQuantity()).isEqualTo(reservedBefore + 1);

        PaymentResponse completed = paymentService.completePayment(payment.paymentId());
        PaymentResponse completedAgain = paymentService.completePayment(payment.paymentId());

        assertThat(completed.status()).isEqualTo(PaymentStatus.SUCCESS.name());
        assertThat(completedAgain.paymentId()).isEqualTo(completed.paymentId());

        Inventory afterCommit = inventoryRepository.findByVariantId(variantId).orElseThrow();
        assertThat(afterCommit.getReservedQuantity()).isEqualTo(reservedBefore);
        assertThat(orderRepository.findById(orderId).orElseThrow().getStatus()).isEqualTo(OrderStatus.PAID);
    }

    @Test
    void failPayment_releasesReservedInventory() {
        UUID variantId = fetchFirstAvailableVariantId();
        String sessionId = "test-session-fail-" + UUID.randomUUID();

        Inventory before = inventoryRepository.findByVariantId(variantId).orElseThrow();
        int availableBefore = before.getAvailableQuantity();

        restTemplate.postForEntity(
                "/api/v1/cart/items",
                new AddCartItemRequest(sessionId, variantId, 1),
                Void.class
        );

        ResponseEntity<OrderResponse> orderResponse = restTemplate.postForEntity(
                "/api/v1/orders",
                new CreateOrderRequest(sessionId),
                OrderResponse.class
        );
        UUID orderId = orderResponse.getBody().orderId();

        PaymentResponse payment = paymentService.createPayment(
                new CreatePaymentRequest(orderId, "idem-fail-" + UUID.randomUUID())
        );

        paymentService.failPayment(payment.paymentId(), "Card declined");

        Inventory afterRelease = inventoryRepository.findByVariantId(variantId).orElseThrow();
        assertThat(afterRelease.getAvailableQuantity()).isEqualTo(availableBefore);
        assertThat(orderRepository.findById(orderId).orElseThrow().getStatus()).isEqualTo(OrderStatus.FAILED);
    }

    @Test
    void illegalOrderTransition_throwsInvalidOrderStateException() {
        UUID variantId = fetchFirstAvailableVariantId();
        String sessionId = "test-session-invalid-" + UUID.randomUUID();

        restTemplate.postForEntity(
                "/api/v1/cart/items",
                new AddCartItemRequest(sessionId, variantId, 1),
                Void.class
        );

        ResponseEntity<OrderResponse> orderResponse = restTemplate.postForEntity(
                "/api/v1/orders",
                new CreateOrderRequest(sessionId),
                OrderResponse.class
        );
        UUID orderId = orderResponse.getBody().orderId();

        PaymentResponse payment = paymentService.createPayment(
                new CreatePaymentRequest(orderId, "idem-invalid-" + UUID.randomUUID())
        );
        paymentService.completePayment(payment.paymentId());

        Order paidOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(paidOrder.getStatus()).isEqualTo(OrderStatus.PAID);

        org.junit.jupiter.api.Assertions.assertThrows(
                InvalidOrderStateException.class,
                () -> orderLifecycleService.transition(paidOrder, OrderStatus.PENDING, "invalid")
        );
    }

    @Test
    void checkoutTwoOrdersOnLastInventoryUnit() {
        UUID variantId = fetchFirstAvailableVariantId();
        Inventory inventory = inventoryRepository.findByVariantId(variantId).orElseThrow();
        inventory.setAvailableQuantity(1);
        inventory.setReservedQuantity(0);
        inventoryRepository.save(inventory);

        String session1 = "session-first-" + UUID.randomUUID();
        String session2 = "session-second-" + UUID.randomUUID();

        restTemplate.postForEntity(
                "/api/v1/cart/items",
                new AddCartItemRequest(session1, variantId, 1),
                Void.class
        );
        restTemplate.postForEntity(
                "/api/v1/cart/items",
                new AddCartItemRequest(session2, variantId, 1),
                Void.class
        );

        ResponseEntity<OrderResponse> orderResponse1 = restTemplate.postForEntity(
                "/api/v1/orders",
                new CreateOrderRequest(session1),
                OrderResponse.class
        );
        assertThat(orderResponse1.getStatusCode()).isEqualTo(HttpStatus.OK);
        UUID orderId1 = orderResponse1.getBody().orderId();
        assertThat(orderId1).isNotNull();

        Inventory afterOrder1 = inventoryRepository.findByVariantId(variantId).orElseThrow();
        assertThat(afterOrder1.getAvailableQuantity()).isEqualTo(0);
        assertThat(afterOrder1.getReservedQuantity()).isEqualTo(1);

        ResponseEntity<String> orderResponse2 = restTemplate.postForEntity(
                "/api/v1/orders",
                new CreateOrderRequest(session2),
                String.class
        );
        assertThat(orderResponse2.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(orderResponse2.getBody()).contains("Insufficient inventory");

        Inventory finalInventory = inventoryRepository.findByVariantId(variantId).orElseThrow();
        assertThat(finalInventory.getAvailableQuantity()).isEqualTo(0);
        assertThat(finalInventory.getReservedQuantity()).isEqualTo(1);
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
