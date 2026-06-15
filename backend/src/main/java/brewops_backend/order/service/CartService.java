package brewops_backend.order.service;

import brewops_backend.catalog.entity.ProductVariant;
import brewops_backend.catalog.repository.ProductVariantRepository;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.repository.InventoryRepository;
import brewops_backend.order.dto.AddCartItemRequest;
import brewops_backend.order.dto.CartItemResponse;
import brewops_backend.order.dto.CartResponse;
import brewops_backend.order.entity.Cart;
import brewops_backend.order.entity.CartItem;
import brewops_backend.order.repository.CartItemRepository;
import brewops_backend.order.repository.CartRepository;
import brewops_backend.user.entity.User;
import brewops_backend.user.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public CartResponse addItem(AddCartItemRequest request) {

        ProductVariant variant = productVariantRepository.findById(request.variantId())
                .orElseThrow(() -> new IllegalArgumentException("Product variant not found"));

        Inventory inventory = inventoryRepository.findByVariantId(variant.getId())
                .orElseThrow(() -> new IllegalArgumentException("Inventory not found for variant"));

        if (inventory.getAvailableQuantity() < request.quantity()) {
            throw new IllegalArgumentException("Insufficient inventory");
        }

        Cart cart = cartRepository.findBySessionIdAndActiveTrue(request.sessionId())
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setSessionId(request.sessionId());
                    return cartRepository.save(newCart);
                });

        UUID authUserId = getAuthenticatedUserId();
        if (authUserId != null) {
            userRepository.findById(authUserId).ifPresent(cart::setUser);
            cartRepository.save(cart);
        }

        CartItem cartItem = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variant.getId())
                .orElseGet(() -> {
                    CartItem newItem = new CartItem();
                    newItem.setCart(cart);
                    newItem.setVariant(variant);
                    newItem.setQuantity(0);
                    newItem.setUnitPrice(variant.getPrice());
                    return newItem;
                });

        int updatedQuantity = cartItem.getQuantity() + request.quantity();

        if (inventory.getAvailableQuantity() < updatedQuantity) {
            throw new IllegalArgumentException("Insufficient inventory for requested quantity");
        }

        cartItem.setQuantity(updatedQuantity);
        if (request.specialInstructions() != null && !request.specialInstructions().isBlank()) {
            cartItem.setSpecialInstructions(request.specialInstructions());
        }
        cartItemRepository.save(cartItem);

        return getCart(request.sessionId());
    }

    @Transactional
    public CartResponse updateItem(UUID itemId, String sessionId, int quantity) {
        Cart cart = cartRepository.findBySessionIdAndActiveTrue(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));

        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to this cart");
        }

        Inventory inventory = inventoryRepository.findByVariantId(cartItem.getVariant().getId())
                .orElseThrow(() -> new IllegalArgumentException("Inventory not found"));

        if (inventory.getAvailableQuantity() < quantity) {
            throw new IllegalArgumentException("Insufficient inventory");
        }

        cartItem.setQuantity(quantity);
        cartItemRepository.save(cartItem);

        return mapCart(cart);
    }

    @Transactional
    public CartResponse deleteItem(UUID itemId, String sessionId) {
        Cart cart = cartRepository.findBySessionIdAndActiveTrue(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));

        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to this cart");
        }

        cartItemRepository.delete(cartItem);
        cart.getItems().remove(cartItem);

        return mapCart(cart);
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(String sessionId) {
        Cart cart = cartRepository.findBySessionIdAndActiveTrue(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Active cart not found"));

        return mapCart(cart);
    }

    private CartResponse mapCart(Cart cart) {
        List<CartItemResponse> items = cart.getItems()
                .stream()
                .map(item -> {
                    ProductVariant variant = item.getVariant();

                    BigDecimal lineTotal = item.getUnitPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantity()));

                    return new CartItemResponse(
                            item.getId(),
                            variant.getId(),
                            variant.getProduct().getName(),
                            variant.getName(),
                            item.getQuantity(),
                            item.getUnitPrice(),
                            lineTotal
                    );
                })
                .toList();

        BigDecimal totalAmount = items.stream()
                .map(CartItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(
                cart.getId(),
                cart.getSessionId(),
                items,
                totalAmount
        );
    }

    private UUID getAuthenticatedUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof UUID userId) {
            return userId;
        }
        return null;
    }
}
