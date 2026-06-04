package brewops_backend.security;

import brewops_backend.supplier.dto.CreateSupplierRequest;
import brewops_backend.supplier.dto.ReceivePurchaseOrderRequest;
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
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.test.context.ActiveProfiles;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles({"test", "auth-test"})
class SecurityAuthorizationIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String customerToken;
    private String staffToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        customerToken = createTokenForRole(RoleType.CUSTOMER);
        staffToken = createTokenForRole(RoleType.STAFF);
        adminToken = createTokenForRole(RoleType.ADMIN);
    }

    private String createTokenForRole(RoleType roleType) {
        Role role = roleRepository.findByName(roleType)
                .orElseThrow(() -> new IllegalStateException(roleType + " role not seeded"));

        User user = new User();
        user.setFullName(roleType.name() + " User");
        user.setEmail(roleType.name().toLowerCase() + "." + UUID.randomUUID() + "@brewops.local");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setStatus(UserStatus.ACTIVE);
        user.getRoles().add(role);
        User savedUser = userRepository.save(user);

        return jwtService.generateToken(savedUser);
    }

    @Test
    void supplierEndpoints_restrictedToAdmin() {
        CreateSupplierRequest request = new CreateSupplierRequest(
                "Secured Supplier", "Contact", "secured@supplier.local", "+919999999999"
        );

        // 1. Unauthenticated -> 403 Forbidden
        ResponseEntity<Object> unauthResp = restTemplate.postForEntity(
                "/api/v1/suppliers", request, Object.class
        );
        assertThat(unauthResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // 2. Customer -> 403 Forbidden
        HttpHeaders customerHeaders = new HttpHeaders();
        customerHeaders.setBearerAuth(customerToken);
        ResponseEntity<Object> customerResp = restTemplate.exchange(
                "/api/v1/suppliers", HttpMethod.POST, new HttpEntity<>(request, customerHeaders), Object.class
        );
        assertThat(customerResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // 3. Staff -> 403 Forbidden
        HttpHeaders staffHeaders = new HttpHeaders();
        staffHeaders.setBearerAuth(staffToken);
        ResponseEntity<Object> staffResp = restTemplate.exchange(
                "/api/v1/suppliers", HttpMethod.POST, new HttpEntity<>(request, staffHeaders), Object.class
        );
        assertThat(staffResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // 4. Admin -> 200 OK
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.setBearerAuth(adminToken);
        ResponseEntity<Object> adminResp = restTemplate.exchange(
                "/api/v1/suppliers", HttpMethod.POST, new HttpEntity<>(request, adminHeaders), Object.class
        );
        assertThat(adminResp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void receivePurchaseOrder_allowedForStaffAndAdmin_forbiddenForCustomer() {
        UUID fakePoId = UUID.randomUUID();
        ReceivePurchaseOrderRequest request = new ReceivePurchaseOrderRequest(null, "Notes");

        // 1. Unauthenticated -> 403 Forbidden
        ResponseEntity<Object> unauthResp = restTemplate.postForEntity(
                "/api/v1/purchase-orders/" + fakePoId + "/receive", request, Object.class
        );
        assertThat(unauthResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // 2. Customer -> 403 Forbidden
        HttpHeaders customerHeaders = new HttpHeaders();
        customerHeaders.setBearerAuth(customerToken);
        ResponseEntity<Object> customerResp = restTemplate.exchange(
                "/api/v1/purchase-orders/" + fakePoId + "/receive", HttpMethod.POST, new HttpEntity<>(request, customerHeaders), Object.class
        );
        assertThat(customerResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // 3. Staff -> 400 Bad Request (not 403 Forbidden, because the endpoint allowed Staff, but fake PO ID doesn't exist)
        HttpHeaders staffHeaders = new HttpHeaders();
        staffHeaders.setBearerAuth(staffToken);
        ResponseEntity<Object> staffResp = restTemplate.exchange(
                "/api/v1/purchase-orders/" + fakePoId + "/receive", HttpMethod.POST, new HttpEntity<>(request, staffHeaders), Object.class
        );
        assertThat(staffResp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // 4. Admin -> 400 Bad Request (allowed Admin, but fake PO ID doesn't exist)
        HttpHeaders adminHeaders = new HttpHeaders();
        adminHeaders.setBearerAuth(adminToken);
        ResponseEntity<Object> adminResp = restTemplate.exchange(
                "/api/v1/purchase-orders/" + fakePoId + "/receive", HttpMethod.POST, new HttpEntity<>(request, adminHeaders), Object.class
        );
        assertThat(adminResp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
