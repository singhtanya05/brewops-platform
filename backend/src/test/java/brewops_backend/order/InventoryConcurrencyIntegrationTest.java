package brewops_backend.order;

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
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
public class InventoryConcurrencyIntegrationTest {

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
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductVariantRepository variantRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;

    private UUID targetVariantId;

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
        inventory.setAvailableQuantity(1); // EXACTLY 1 ITEM IN STOCK
        inventoryRepository.save(inventory);
    }

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @AfterEach
    void tearDown() {
        jdbcTemplate.execute("DELETE FROM cart_items");
        jdbcTemplate.execute("DELETE FROM carts");
        jdbcTemplate.execute("DELETE FROM inventory_movements");
        jdbcTemplate.execute("DELETE FROM order_items");
        jdbcTemplate.execute("DELETE FROM orders");
        inventoryRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void testConcurrency_OnlyOneUserCanBuyLastItem() throws InterruptedException {
        // Setup 2 distinct user sessions that both add the last item to their cart
        String user1Session = "session1-" + UUID.randomUUID();
        String user2Session = "session2-" + UUID.randomUUID();

        // Both successfully add to cart (since cart adding doesn't deduct inventory yet, wait, CartService DOES check inventory, but what if they do it sequentially? Actually, CartService doesn't lock for cart adding, so both can add it to their carts)
        ResponseEntity<Void> res1 = restTemplate.postForEntity("/api/v1/cart/items", new AddCartItemRequest(user1Session, targetVariantId, 1, null), Void.class);
        ResponseEntity<Void> res2 = restTemplate.postForEntity("/api/v1/cart/items", new AddCartItemRequest(user2Session, targetVariantId, 1, null), Void.class);
        assertThat(res1.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res2.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Now they both try to CHECKOUT at the exact same millisecond
        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        Runnable checkoutTask1 = () -> {
            try {
                latch.await();
                ResponseEntity<OrderResponse> response = restTemplate.postForEntity("/api/v1/orders", new CreateOrderRequest(user1Session), OrderResponse.class);
                if (response.getStatusCode() == HttpStatus.OK) successCount.incrementAndGet();
                else failCount.incrementAndGet();
            } catch (Exception e) {
                failCount.incrementAndGet();
            } finally {
                doneLatch.countDown();
            }
        };

        Runnable checkoutTask2 = () -> {
            try {
                latch.await();
                ResponseEntity<OrderResponse> response = restTemplate.postForEntity("/api/v1/orders", new CreateOrderRequest(user2Session), OrderResponse.class);
                if (response.getStatusCode() == HttpStatus.OK) successCount.incrementAndGet();
                else failCount.incrementAndGet();
            } catch (Exception e) {
                failCount.incrementAndGet();
            } finally {
                doneLatch.countDown();
            }
        };

        executor.submit(checkoutTask1);
        executor.submit(checkoutTask2);

        // Fire the starting gun
        latch.countDown();

        // Wait for both to finish
        doneLatch.await();

        // EXACTLY ONE should succeed, and ONE should fail due to pessimistic locking and validation!
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(failCount.get()).isEqualTo(1);

        // Verify inventory state
        Inventory inventory = inventoryRepository.findByVariantId(targetVariantId).orElseThrow();
        assertThat(inventory.getAvailableQuantity()).isEqualTo(0);
        assertThat(inventory.getReservedQuantity()).isEqualTo(1);
    }
}
