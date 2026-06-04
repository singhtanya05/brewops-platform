package brewops_backend.kitchen.dto;

public record KitchenOrderItemResponse(
        String productName,
        String variantName,
        Integer quantity,
        String specialInstructions
) {}
