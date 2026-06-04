package brewops_backend.supplier.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record CreatePurchaseOrderRequest(
        @NotNull UUID supplierId,
        @NotBlank String poNumber,
        @NotNull @Valid List<PurchaseOrderItemRequest> items
) {}
