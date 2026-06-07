package brewops_backend.order.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateCartItemRequest(
        @JsonProperty("quantity")
        @NotNull
        @Min(1)
        Integer quantity
) {}
