package brewops_backend.kitchen.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateKitchenOrderStatusRequest(
        @NotBlank String status
) {}
