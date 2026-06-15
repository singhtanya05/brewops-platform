package brewops_backend.payment;

import brewops_backend.BackendApplication;
import brewops_backend.catalog.entity.Category;
import brewops_backend.catalog.entity.Product;
import brewops_backend.catalog.entity.ProductStatus;
import brewops_backend.catalog.entity.ProductVariant;
import brewops_backend.catalog.repository.CategoryRepository;
import brewops_backend.catalog.repository.ProductRepository;
import brewops_backend.catalog.repository.ProductVariantRepository;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.repository.InventoryRepository;
import brewops_backend.order.dto.AddCartItemRequest;
import brewops_backend.order.dto.CreateOrderRequest;
import brewops_backend.order.dto.OrderResponse;
import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderStatus;
import brewops_backend.order.repository.OrderRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
public class PaymentFailureIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void registerPgProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private UUID targetVariantId;
    private String sessionId;

    @BeforeEach
    void setup() {
        Category category = new Category();
        category.setName("Test Category");
        category.setSlug("test-cat");
        category.setActive(true);
        categoryRepository.save(category);

        Product product = new Product();
        product.setCategory(category);
        product.setName("Test Product");
        product.setSlug("test-product");
        product.setStatus(ProductStatus.ACTIVE);
        productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setName("Test Variant");
        variant.setSku("TEST-VAR-1");
        variant.setPrice(new BigDecimal("5.00"));
        variant.setCurrency("USD");
        variant.setActive(true);
        variant = variantRepository.save(variant);

        targetVariantId = variant.getId();

        Inventory inventory = new Inventory();
        inventory.setVariant(variant);
        inventory.setAvailableQuantity(10);
        inventoryRepository.save(inventory);

        sessionId = "session-" + UUID.randomUUID();
    }

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @AfterEach
    void tearDown() {
        jdbcTemplate.execute("DELETE FROM payments");
        jdbcTemplate.execute("DELETE FROM inventory_movements");
        jdbcTemplate.execute("DELETE FROM cart_items");
        jdbcTemplate.execute("DELETE FROM carts");
        jdbcTemplate.execute("DELETE FROM order_items");
        orderRepository.deleteAll();
        inventoryRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void paymentFailed_UpdatesOrderStatusAndReleasesInventory() {
        ResponseEntity<Void> cartRes = restTemplate.postForEntity("/api/v1/cart/items", new AddCartItemRequest(sessionId, targetVariantId, 2, null), Void.class);
        assertThat(cartRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<OrderResponse> orderResponse = restTemplate.postForEntity(
                "/api/v1/orders",
                new CreateOrderRequest(sessionId),
                OrderResponse.class
        );
        
        assertThat(orderResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        UUID orderId = orderResponse.getBody().orderId();

        // Verify inventory is reserved
        Inventory inventory = inventoryRepository.findByVariantId(targetVariantId).orElseThrow();
        assertThat(inventory.getAvailableQuantity()).isEqualTo(8);
        assertThat(inventory.getReservedQuantity()).isEqualTo(2);

        // Create a Payment first
        brewops_backend.payment.dto.CreatePaymentRequest paymentRequest = new brewops_backend.payment.dto.CreatePaymentRequest(
                orderId,
                UUID.randomUUID().toString()
        );
        ResponseEntity<brewops_backend.payment.dto.PaymentResponse> paymentResponse = restTemplate.postForEntity(
                "/api/v1/payments",
                paymentRequest,
                brewops_backend.payment.dto.PaymentResponse.class
        );
        assertThat(paymentResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        UUID paymentId = paymentResponse.getBody().paymentId();

        // Simulate a Payment Failed Webhook/Callback
        brewops_backend.payment.dto.FailPaymentRequest failRequest = new brewops_backend.payment.dto.FailPaymentRequest("Insufficient Funds");
        ResponseEntity<Void> failResponse = restTemplate.postForEntity(
                "/api/v1/payments/" + paymentId + "/fail",
                failRequest,
                Void.class
        );
        assertThat(failResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Verify order is failed
        Order order = orderRepository.findById(orderId).orElseThrow();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.FAILED);

        // Verify inventory is released back!
        inventory = inventoryRepository.findByVariantId(targetVariantId).orElseThrow();
        assertThat(inventory.getAvailableQuantity()).isEqualTo(10);
        assertThat(inventory.getReservedQuantity()).isEqualTo(0);
    }
}
