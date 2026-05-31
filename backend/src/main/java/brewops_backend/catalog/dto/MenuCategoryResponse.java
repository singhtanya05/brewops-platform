package brewops_backend.catalog.dto;

import java.util.List;
import java.util.UUID;

public record MenuCategoryResponse(
        UUID categoryId,
        String name,
        String slug,
        List<MenuProductResponse> products
) {}
