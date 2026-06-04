package brewops_backend.inventory.dto;

import java.util.UUID;

public record InventorySummaryResponse(
        UUID inventoryId,
        UUID variantId,
        String sku,
        Integer availableQuantity,
        Integer reservedQuantity,
        Integer lowStockThreshold,
        boolean lowStock
) {}
