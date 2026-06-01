package brewops_backend.order.controller;

import brewops_backend.order.dto.AddCartItemRequest;
import brewops_backend.order.dto.CartResponse;
import brewops_backend.order.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
}
