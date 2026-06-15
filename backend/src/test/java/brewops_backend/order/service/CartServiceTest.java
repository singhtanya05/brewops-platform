package brewops_backend.order.service;

import brewops_backend.catalog.entity.Product;
import brewops_backend.catalog.entity.ProductVariant;
import brewops_backend.catalog.repository.ProductVariantRepository;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.repository.InventoryRepository;
import brewops_backend.order.dto.AddCartItemRequest;
import brewops_backend.order.dto.CartResponse;
import brewops_backend.order.entity.Cart;
import brewops_backend.order.entity.CartItem;
import brewops_backend.order.repository.CartItemRepository;
import brewops_backend.order.repository.CartRepository;
import brewops_backend.user.entity.User;
import brewops_backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartService cartService;

    private UUID variantId;
    private String sessionId;
    private ProductVariant variant;
    private Inventory inventory;
    private Cart cart;
    private CartItem cartItem;

    @BeforeEach
    void setUp() {
        variantId = UUID.randomUUID();
        sessionId = "test-session";

        variant = new ProductVariant();
        variant.setId(variantId);
        variant.setPrice(new BigDecimal("5.00"));
        variant.setName("Test Variant");
        
        Product product = new Product();
        product.setName("Test Product");
        variant.setProduct(product);

        inventory = new Inventory();
        inventory.setVariant(variant);
        inventory.setAvailableQuantity(10);

        cart = new Cart();
        cart.setId(UUID.randomUUID());
        cart.setSessionId(sessionId);

        cartItem = new CartItem();
        cartItem.setId(UUID.randomUUID());
        cartItem.setCart(cart);
        cartItem.setVariant(variant);
        cartItem.setQuantity(2);
        cartItem.setUnitPrice(new BigDecimal("5.00"));
        
        // Mutable list so deleteItem can remove from it
        List<CartItem> items = new ArrayList<>();
        items.add(cartItem);
        cart.setItems(items);
        
        SecurityContextHolder.clearContext();
    }

    private void mockAuthenticatedUser(UUID userId) {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userId);
    }

    // --- addItem Tests ---

    @Test
    void addItem_HappyPath_CreatesNewCartAndItem_Guest() {
        AddCartItemRequest request = new AddCartItemRequest(sessionId, variantId, 2, "Extra hot");

        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(inventoryRepository.findByVariantId(variantId)).thenReturn(Optional.of(inventory));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);
        when(cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)).thenReturn(Optional.empty());
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.empty(), Optional.of(cart));

        CartResponse response = cartService.addItem(request);

        assertNotNull(response);
        verify(cartRepository, times(1)).save(any(Cart.class));
        verify(cartItemRepository, times(1)).save(any(CartItem.class));
    }

    @Test
    void addItem_HappyPath_AuthenticatedUser() {
        UUID userId = UUID.randomUUID();
        mockAuthenticatedUser(userId);
        User user = new User();
        user.setId(userId);
        
        AddCartItemRequest request = new AddCartItemRequest(sessionId, variantId, 2, null);

        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(inventoryRepository.findByVariantId(variantId)).thenReturn(Optional.of(inventory));
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.of(cart), Optional.of(cart));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)).thenReturn(Optional.empty());

        CartResponse response = cartService.addItem(request);

        assertNotNull(response);
        verify(userRepository, times(1)).findById(userId);
        verify(cartRepository, times(1)).save(cart);
        assertEquals(user, cart.getUser());
    }

    @Test
    void addItem_HappyPath_ExistingItem_IncrementsQuantity() {
        AddCartItemRequest request = new AddCartItemRequest(sessionId, variantId, 3, null);

        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(inventoryRepository.findByVariantId(variantId)).thenReturn(Optional.of(inventory));
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.of(cart), Optional.of(cart));
        when(cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)).thenReturn(Optional.of(cartItem));

        CartResponse response = cartService.addItem(request);

        assertNotNull(response);
        assertEquals(5, cartItem.getQuantity()); // 2 + 3
        verify(cartItemRepository, times(1)).save(cartItem);
    }

    @Test
    void addItem_ThrowsException_IfVariantNotFound() {
        AddCartItemRequest request = new AddCartItemRequest(sessionId, variantId, 1, null);
        when(productVariantRepository.findById(variantId)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> cartService.addItem(request));
        assertEquals("Product variant not found", exception.getMessage());
    }

    @Test
    void addItem_ThrowsException_IfInventoryNotFound() {
        AddCartItemRequest request = new AddCartItemRequest(sessionId, variantId, 1, null);
        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(inventoryRepository.findByVariantId(variantId)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> cartService.addItem(request));
        assertEquals("Inventory not found for variant", exception.getMessage());
    }

    @Test
    void addItem_ThrowsException_IfInsufficientInitialInventory() {
        AddCartItemRequest request = new AddCartItemRequest(sessionId, variantId, 15, null);
        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(inventoryRepository.findByVariantId(variantId)).thenReturn(Optional.of(inventory));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> cartService.addItem(request));
        assertEquals("Insufficient inventory", exception.getMessage());
    }

    @Test
    void addItem_ThrowsException_IfInsufficientCombinedInventory() {
        // Inventory has 10. CartItem already has 2. Requesting 9 more (total 11).
        AddCartItemRequest request = new AddCartItemRequest(sessionId, variantId, 9, null);

        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(inventoryRepository.findByVariantId(variantId)).thenReturn(Optional.of(inventory));
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartIdAndVariantId(cart.getId(), variantId)).thenReturn(Optional.of(cartItem));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> cartService.addItem(request));
        assertEquals("Insufficient inventory for requested quantity", exception.getMessage());
    }

    // --- updateItem Tests ---

    @Test
    void updateItem_HappyPath_UpdatesQuantity() {
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(cartItem.getId())).thenReturn(Optional.of(cartItem));
        when(inventoryRepository.findByVariantId(variantId)).thenReturn(Optional.of(inventory));

        CartResponse response = cartService.updateItem(cartItem.getId(), sessionId, 5);

        assertNotNull(response);
        assertEquals(5, cartItem.getQuantity());
        verify(cartItemRepository, times(1)).save(cartItem);
    }

    @Test
    void updateItem_ThrowsException_CartNotFound() {
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> cartService.updateItem(cartItem.getId(), sessionId, 5));
        assertEquals("Cart not found", exception.getMessage());
    }

    @Test
    void updateItem_ThrowsException_ItemNotFound() {
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(cartItem.getId())).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> cartService.updateItem(cartItem.getId(), sessionId, 5));
        assertEquals("Cart item not found", exception.getMessage());
    }

    @Test
    void updateItem_ThrowsException_WrongCart() {
        Cart otherCart = new Cart();
        otherCart.setId(UUID.randomUUID());
        
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.of(otherCart));
        when(cartItemRepository.findById(cartItem.getId())).thenReturn(Optional.of(cartItem));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> cartService.updateItem(cartItem.getId(), sessionId, 5));
        assertEquals("Cart item does not belong to this cart", exception.getMessage());
    }

    @Test
    void updateItem_ThrowsException_InsufficientInventory() {
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(cartItem.getId())).thenReturn(Optional.of(cartItem));
        when(inventoryRepository.findByVariantId(variantId)).thenReturn(Optional.of(inventory));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> cartService.updateItem(cartItem.getId(), sessionId, 15));
        assertEquals("Insufficient inventory", exception.getMessage());
    }

    // --- deleteItem Tests ---

    @Test
    void deleteItem_HappyPath_RemovesItem() {
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findById(cartItem.getId())).thenReturn(Optional.of(cartItem));

        CartResponse response = cartService.deleteItem(cartItem.getId(), sessionId);

        assertNotNull(response);
        assertTrue(cart.getItems().isEmpty());
        verify(cartItemRepository, times(1)).delete(cartItem);
    }

    @Test
    void deleteItem_ThrowsException_WrongCart() {
        Cart otherCart = new Cart();
        otherCart.setId(UUID.randomUUID());

        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.of(otherCart));
        when(cartItemRepository.findById(cartItem.getId())).thenReturn(Optional.of(cartItem));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> cartService.deleteItem(cartItem.getId(), sessionId));
        assertEquals("Cart item does not belong to this cart", exception.getMessage());
    }

    // --- getCart Tests ---

    @Test
    void getCart_HappyPath_MapsCartAndCalculatesTotals() {
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.of(cart));

        CartResponse response = cartService.getCart(sessionId);

        assertNotNull(response);
        assertEquals(1, response.items().size());
        assertEquals(new BigDecimal("10.00"), response.items().get(0).lineTotal()); // 2 * 5.00
        assertEquals(new BigDecimal("10.00"), response.totalAmount());
    }

    @Test
    void getCart_ThrowsException_ActiveCartNotFound() {
        when(cartRepository.findBySessionIdAndActiveTrue(sessionId)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> cartService.getCart(sessionId));
        assertEquals("Active cart not found", exception.getMessage());
    }
}
