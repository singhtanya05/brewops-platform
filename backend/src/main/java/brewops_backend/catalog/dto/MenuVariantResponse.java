package brewops_backend.catalog.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MenuVariantResponse(
        UUID variantId,
        String name,
        String sku,
        BigDecimal price,
        String currency,
        Integer availableQuantity
) {}
