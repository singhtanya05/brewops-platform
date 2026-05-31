package brewops_backend.catalog.dto;

import java.util.List;
import java.util.UUID;

public record MenuProductResponse(
        UUID productId,
        String name,
        String slug,
        String description,
        String imageUrl,
        List<MenuVariantResponse> variants
) {}
