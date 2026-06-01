package brewops_backend.order.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CartResponse(
        UUID cartId,
        String sessionId,
        List<CartItemResponse> items,
        BigDecimal totalAmount
) {}
