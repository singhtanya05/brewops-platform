package brewops_backend.inventory.controller;

import brewops_backend.inventory.dto.InventoryAdjustmentRequest;
import brewops_backend.inventory.dto.InventorySummaryResponse;
import brewops_backend.inventory.service.InventoryAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/inventory")
public class InventoryAdminController {

    private final InventoryAdminService inventoryAdminService;

    @GetMapping("/low-stock")
    public List<InventorySummaryResponse> getLowStock() {
        return inventoryAdminService.getLowStock();
    }

    @PostMapping("/variants/{variantId}/adjust")
    public InventorySummaryResponse adjust(
            @PathVariable UUID variantId,
            @Valid @RequestBody InventoryAdjustmentRequest request
    ) {
        return inventoryAdminService.adjust(variantId, request);
    }
}
