package brewops_backend.order;

import brewops_backend.catalog.dto.MenuCategoryResponse;
import brewops_backend.catalog.dto.MenuVariantResponse;
import brewops_backend.order.dto.AddCartItemRequest;
import brewops_backend.order.dto.CartResponse;
import brewops_backend.order.dto.CreateOrderRequest;
import brewops_backend.order.dto.OrderResponse;
import brewops_backend.order.entity.Cart;
import brewops_backend.order.entity.Order;
import brewops_backend.order.repository.CartRepository;
import brewops_backend.order.repository.OrderRepository;
import brewops_backend.user.entity.Role;
import brewops_backend.user.entity.RoleType;
import brewops_backend.user.entity.User;
import brewops_backend.user.entity.UserStatus;
import brewops_backend.user.repository.RoleRepository;
import brewops_backend.user.repository.UserRepository;
import brewops_backend.user.security.JwtService;
import brewops_backend.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserCartOrderIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void cartAndOrderAssignsUserWhenAuthenticated() {
        Role customerRole = roleRepository.findByName(RoleType.CUSTOMER)
                .orElseThrow(() -> new IllegalStateException("CUSTOMER role not seeded"));

        User user = new User();
        user.setFullName("JWT Test User");
        user.setEmail("jwt.test.user." + UUID.randomUUID() + "@brewops.local");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setStatus(UserStatus.ACTIVE);
        user.getRoles().add(customerRole);
        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser);
        UUID variantId = fetchFirstAvailableVariantId();
        String sessionId = "auth-session-" + UUID.randomUUID();

        // 1. Add cart item with JWT
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<AddCartItemRequest> cartRequest = new HttpEntity<>(
                new AddCartItemRequest(sessionId, variantId, 1, "Oat Milk, Extra Hot"),
                headers
        );

        ResponseEntity<CartResponse> cartResponse = restTemplate.exchange(
                "/api/v1/cart/items",
                HttpMethod.POST,
                cartRequest,
                CartResponse.class
        );
        assertThat(cartResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        Cart cart = cartRepository.findBySessionIdAndActiveTrue(sessionId).orElseThrow();
        assertThat(cart.getUser()).isNotNull();
        assertThat(cart.getUser().getId()).isEqualTo(savedUser.getId());

        // 2. Checkout order with JWT
        HttpEntity<CreateOrderRequest> orderRequest = new HttpEntity<>(
                new CreateOrderRequest(sessionId),
                headers
        );

        ResponseEntity<OrderResponse> orderResponse = restTemplate.exchange(
                "/api/v1/orders",
                HttpMethod.POST,
                orderRequest,
                OrderResponse.class
        );
        assertThat(orderResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        UUID orderId = orderResponse.getBody().orderId();

        Order order = orderRepository.findWithItemsById(orderId).orElseThrow();
        assertThat(order.getUser()).isNotNull();
        assertThat(order.getUser().getId()).isEqualTo(savedUser.getId());
        assertThat(order.getItems().get(0).getSpecialInstructions()).isEqualTo("Oat Milk, Extra Hot");
    }

    @Test
    void cartAndOrderHaveNullUserForGuest() {
        UUID variantId = fetchFirstAvailableVariantId();
        String sessionId = "guest-session-" + UUID.randomUUID();

        // 1. Add cart item (Guest - no JWT)
        ResponseEntity<CartResponse> cartResponse = restTemplate.postForEntity(
                "/api/v1/cart/items",
                new AddCartItemRequest(sessionId, variantId, 1, null),
                CartResponse.class
        );
        assertThat(cartResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        Cart cart = cartRepository.findBySessionIdAndActiveTrue(sessionId).orElseThrow();
        assertThat(cart.getUser()).isNull();

        // 2. Checkout order (Guest - no JWT)
        ResponseEntity<OrderResponse> orderResponse = restTemplate.postForEntity(
                "/api/v1/orders",
                new CreateOrderRequest(sessionId),
                OrderResponse.class
        );
        assertThat(orderResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        UUID orderId = orderResponse.getBody().orderId();

        Order order = orderRepository.findById(orderId).orElseThrow();
        assertThat(order.getUser()).isNull();
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
