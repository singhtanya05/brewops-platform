package brewops_backend.order.controller;

import brewops_backend.order.dto.CreateOrderRequest;
import brewops_backend.order.dto.OrderDetailResponse;
import brewops_backend.order.dto.OrderResponse;
import brewops_backend.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping("/{id}")
    public OrderDetailResponse getOrder(@PathVariable UUID id) {
        return orderService.getOrder(id);
    }

    @GetMapping("/{id}/status")
    public OrderResponse getOrderStatus(@PathVariable UUID id) {
        return orderService.getOrderStatus(id);
    }
}
