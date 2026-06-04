package brewops_backend.supplier;

import brewops_backend.catalog.dto.MenuCategoryResponse;
import brewops_backend.catalog.dto.MenuVariantResponse;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.repository.InventoryRepository;
import brewops_backend.supplier.dto.CreatePurchaseOrderRequest;
import brewops_backend.supplier.dto.CreateSupplierRequest;
import brewops_backend.supplier.dto.PurchaseOrderItemRequest;
import brewops_backend.supplier.dto.ReceivePurchaseOrderRequest;
import brewops_backend.supplier.entity.PurchaseOrder;
import brewops_backend.supplier.entity.PurchaseOrderStatus;
import brewops_backend.supplier.entity.Supplier;
import brewops_backend.supplier.repository.PurchaseOrderRepository;
import brewops_backend.user.entity.Role;
import brewops_backend.user.entity.RoleType;
import brewops_backend.user.entity.User;
import brewops_backend.user.entity.UserStatus;
import brewops_backend.user.repository.RoleRepository;
import brewops_backend.user.repository.UserRepository;
import brewops_backend.user.security.JwtService;
import brewops_backend.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles({"test", "auth-test"})
class SupplierPOIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role not seeded"));

        User user = new User();
        user.setFullName("Admin User");
        user.setEmail("admin." + UUID.randomUUID() + "@brewops.local");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setStatus(UserStatus.ACTIVE);
        user.getRoles().add(adminRole);
        User savedUser = userRepository.save(user);

        adminToken = jwtService.generateToken(savedUser);
    }

    @Test
    void poLifecycle_restocksInventoryOnReceipt() {
        // 1. Fetch variant and check initial inventory
        UUID variantId = fetchFirstAvailableVariantId();
        Inventory initialInv = inventoryRepository.findByVariantId(variantId).orElseThrow();
        int availableBefore = initialInv.getAvailableQuantity();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        // 2. Create Supplier
        ResponseEntity<Supplier> supplierResp = restTemplate.exchange(
                "/api/v1/suppliers",
                HttpMethod.POST,
                new HttpEntity<>(
                        new CreateSupplierRequest(
                                "SupplyCo " + UUID.randomUUID(),
                                "John Doe",
                                "john@" + UUID.randomUUID() + ".com",
                                "+919999999999"
                        ),
                        headers
                ),
                Supplier.class
        );
        assertThat(supplierResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        UUID supplierId = supplierResp.getBody().getId();
        assertThat(supplierId).isNotNull();

        // 3. Create Purchase Order (status = DRAFT)
        String poNumber = "PO-" + UUID.randomUUID();
        CreatePurchaseOrderRequest poRequest = new CreatePurchaseOrderRequest(
                supplierId,
                poNumber,
                List.of(new PurchaseOrderItemRequest(variantId, 10, BigDecimal.valueOf(50.00)))
        );

        ResponseEntity<PurchaseOrder> poResp = restTemplate.exchange(
                "/api/v1/purchase-orders",
                HttpMethod.POST,
                new HttpEntity<>(poRequest, headers),
                PurchaseOrder.class
        );
        assertThat(poResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        UUID poId = poResp.getBody().getId();
        assertThat(poId).isNotNull();
        assertThat(poResp.getBody().getStatus()).isEqualTo(PurchaseOrderStatus.DRAFT);

        // 4. Transition to ORDERED
        ResponseEntity<PurchaseOrder> orderedResp = restTemplate.exchange(
                "/api/v1/purchase-orders/" + poId + "/order",
                HttpMethod.POST,
                new HttpEntity<>(null, headers),
                PurchaseOrder.class
        );
        assertThat(orderedResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(orderedResp.getBody().getStatus()).isEqualTo(PurchaseOrderStatus.ORDERED);

        // 5. Transition to RECEIVED (restocks inventory)
        ResponseEntity<PurchaseOrder> receivedResp = restTemplate.exchange(
                "/api/v1/purchase-orders/" + poId + "/receive",
                HttpMethod.POST,
                new HttpEntity<>(new ReceivePurchaseOrderRequest(null, "Delivered on time"), headers),
                PurchaseOrder.class
        );
        assertThat(receivedResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(receivedResp.getBody().getStatus()).isEqualTo(PurchaseOrderStatus.RECEIVED);

        // 6. Verify inventory increased by 10
        Inventory updatedInv = inventoryRepository.findByVariantId(variantId).orElseThrow();
        assertThat(updatedInv.getAvailableQuantity()).isEqualTo(availableBefore + 10);
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
