package brewops_backend.payment.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentResponse(
        UUID paymentId,
        UUID orderId,
        String provider,
        String status,
        BigDecimal amount,
        String currency,
        String idempotencyKey,
        String providerPaymentIntentId,
        String clientSecret
) {}
