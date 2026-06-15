package brewops_backend.order.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemDetailResponse(
        UUID id,
        UUID variantId,
        String productName,
        String variantName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        String specialInstructions
) {}
