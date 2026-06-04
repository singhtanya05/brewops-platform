package brewops_backend.inventory.service;

import brewops_backend.catalog.entity.ProductVariant;
import brewops_backend.catalog.repository.ProductVariantRepository;
import brewops_backend.inventory.dto.InventoryAdjustmentRequest;
import brewops_backend.inventory.dto.InventorySummaryResponse;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.entity.InventoryMovementType;
import brewops_backend.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryAdminService {

    private final InventoryRepository inventoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryService inventoryService;

    @Transactional(readOnly = true)
    public List<InventorySummaryResponse> getLowStock() {
        return inventoryRepository.findAll().stream()
                .filter(inv -> inv.getAvailableQuantity() <= inv.getLowStockThreshold())
                .map(this::mapSummary)
                .toList();
    }

    @Transactional
    public InventorySummaryResponse adjust(UUID variantId, InventoryAdjustmentRequest request) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Variant not found"));

        Inventory inventory = inventoryRepository.findWithLockByVariantId(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory not found"));

        int delta = request.quantityDelta();
        int newAvailable = inventory.getAvailableQuantity() + delta;
        if (newAvailable < 0) {
            throw new IllegalArgumentException("Adjustment would make available quantity negative");
        }

        inventory.setAvailableQuantity(newAvailable);
        inventoryRepository.save(inventory);

        InventoryMovementType type = delta >= 0 ? InventoryMovementType.STOCK_IN : InventoryMovementType.ADJUSTED;
        inventoryService.recordAdjustment(inventory, Math.abs(delta), type, request.reason());

        return mapSummary(inventory);
    }

    private InventorySummaryResponse mapSummary(Inventory inventory) {
        ProductVariant variant = inventory.getVariant();
        boolean lowStock = inventory.getAvailableQuantity() <= inventory.getLowStockThreshold();
        return new InventorySummaryResponse(
                inventory.getId(),
                variant.getId(),
                variant.getSku(),
                inventory.getAvailableQuantity(),
                inventory.getReservedQuantity(),
                inventory.getLowStockThreshold(),
                lowStock
        );
    }
}
