package brewops_backend.supplier.dto;

import java.util.UUID;

public record ReceivePurchaseOrderRequest(
        UUID receivedByUserId,
        String notes
) {}
