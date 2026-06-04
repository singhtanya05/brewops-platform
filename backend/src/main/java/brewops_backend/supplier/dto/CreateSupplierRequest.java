package brewops_backend.supplier.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSupplierRequest(
        @NotBlank String name,
        String contactName,
        @NotBlank String email,
        String phone
) {}
