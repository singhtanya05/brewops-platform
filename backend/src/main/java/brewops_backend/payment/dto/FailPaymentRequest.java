package brewops_backend.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record FailPaymentRequest(
        @NotBlank String reason
) {}
