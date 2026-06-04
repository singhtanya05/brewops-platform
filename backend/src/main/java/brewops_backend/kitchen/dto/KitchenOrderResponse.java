package brewops_backend.kitchen.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record KitchenOrderResponse(
        UUID id,
        String orderNumber,
        String status,
        BigDecimal totalAmount,
        String currency,
        LocalDateTime createdAt,
        List<KitchenOrderItemResponse> items
) {}
