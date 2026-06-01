package brewops_backend.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddCartItemRequest(
        @NotBlank String sessionId,
        @NotNull UUID variantId,
        @Min(1) Integer quantity
) {}
