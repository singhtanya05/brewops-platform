package brewops_backend.catalog.service;

import brewops_backend.catalog.dto.MenuCategoryResponse;
import brewops_backend.catalog.dto.MenuProductResponse;
import brewops_backend.catalog.dto.MenuVariantResponse;
import brewops_backend.catalog.entity.Category;
import brewops_backend.catalog.entity.Product;
import brewops_backend.catalog.entity.ProductStatus;
import brewops_backend.catalog.repository.CategoryRepository;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;

    public List<MenuCategoryResponse> getMenu() {
        return categoryRepository.findAll()
                .stream()
                .filter(category -> Boolean.TRUE.equals(category.getActive()))
                .map(this::mapCategory)
                .toList();
    }

    private MenuCategoryResponse mapCategory(Category category) {
        List<MenuProductResponse> products = category.getProducts()
                .stream()
                .filter(product -> product.getStatus() == ProductStatus.ACTIVE)
                .map(this::mapProduct)
                .toList();

        return new MenuCategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                products
        );
    }

    private MenuProductResponse mapProduct(Product product) {
        List<MenuVariantResponse> variants = product.getVariants()
                .stream()
                .filter(variant -> Boolean.TRUE.equals(variant.getActive()))
                .map(variant -> {
                    Inventory inventory = inventoryRepository.findByVariantId(variant.getId())
                            .orElse(null);

                    Integer availableQuantity = inventory == null ? 0 : inventory.getAvailableQuantity();

                    return new MenuVariantResponse(
                            variant.getId(),
                            variant.getName(),
                            variant.getSku(),
                            variant.getPrice(),
                            variant.getCurrency(),
                            availableQuantity
                    );
                })
                .toList();

        return new MenuProductResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getDescription(),
                product.getImageUrl(),
                variants
        );
    }
}
