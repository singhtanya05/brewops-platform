package brewops_backend.order.controller;

import brewops_backend.order.dto.AddCartItemRequest;
import brewops_backend.order.dto.CartResponse;
import brewops_backend.order.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import brewops_backend.order.dto.UpdateCartItemRequest;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    @PostMapping("/items")
    public CartResponse addItem(@Valid @RequestBody AddCartItemRequest request) {
        return cartService.addItem(request);
    }

    @GetMapping("/{sessionId}")
    public CartResponse getCart(@PathVariable String sessionId) {
        return cartService.getCart(sessionId);
    }

    @PutMapping("/items/{itemId}")
    public CartResponse updateItem(
            @PathVariable UUID itemId,
            @RequestParam String sessionId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        return cartService.updateItem(itemId, sessionId, request.quantity());
    }

    @DeleteMapping("/items/{itemId}")
    public CartResponse deleteItem(
            @PathVariable UUID itemId,
            @RequestParam String sessionId) {
        return cartService.deleteItem(itemId, sessionId);
    }
}
