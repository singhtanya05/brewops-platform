package brewops_backend.supplier.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseOrderItemRequest(
        @NotNull UUID variantId,
        @NotNull @Min(1) Integer quantity,
        @NotNull @Min(0) BigDecimal unitCost
) {}
