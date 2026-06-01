package brewops_backend.order.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderResponse(
        UUID orderId,
        String orderNumber,
        String status,
        BigDecimal totalAmount
) {}
