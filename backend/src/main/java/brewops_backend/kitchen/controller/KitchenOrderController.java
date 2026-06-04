package brewops_backend.kitchen.controller;

import brewops_backend.kitchen.dto.KitchenOrderResponse;
import brewops_backend.kitchen.dto.UpdateKitchenOrderStatusRequest;
import brewops_backend.kitchen.service.KitchenOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/kitchen/orders")
public class KitchenOrderController {

    private final KitchenOrderService kitchenOrderService;

    @GetMapping
    public List<KitchenOrderResponse> getQueue(
            @RequestParam(required = false) String status
    ) {
        return kitchenOrderService.getQueue(status);
    }

    @PatchMapping("/{id}/status")
    public KitchenOrderResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateKitchenOrderStatusRequest request
    ) {
        return kitchenOrderService.updateStatus(id, request);
    }
}
