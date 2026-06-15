package brewops_backend.catalog.service;

import brewops_backend.catalog.dto.MenuCategoryResponse;
import brewops_backend.catalog.entity.Category;
import brewops_backend.catalog.entity.Product;
import brewops_backend.catalog.entity.ProductStatus;
import brewops_backend.catalog.entity.ProductVariant;
import brewops_backend.catalog.repository.CategoryRepository;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.repository.InventoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MenuServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private MenuService menuService;

    private Category category;
    private Product product;
    private ProductVariant variant;
    private Inventory inventory;

    @BeforeEach
    void setUp() {
        category = new Category();
        category.setId(UUID.randomUUID());
        category.setName("Coffee");
        category.setSlug("coffee");
        category.setActive(true);

        product = new Product();
        product.setId(UUID.randomUUID());
        product.setName("Latte");
        product.setStatus(ProductStatus.ACTIVE);

        variant = new ProductVariant();
        variant.setId(UUID.randomUUID());
        variant.setName("Small");
        variant.setPrice(new BigDecimal("4.50"));
        variant.setActive(true);

        product.setVariants(List.of(variant));
        category.setProducts(List.of(product));

        inventory = new Inventory();
        inventory.setVariant(variant);
        inventory.setAvailableQuantity(10);
    }

    @Test
    void getMenu_HappyPath_ReturnsActiveCategoriesAndProducts() {
        when(categoryRepository.findAll()).thenReturn(List.of(category));
        when(inventoryRepository.findByVariantId(variant.getId())).thenReturn(Optional.of(inventory));

        List<MenuCategoryResponse> menu = menuService.getMenu();

        assertEquals(1, menu.size());
        assertEquals("Coffee", menu.get(0).name());
        assertEquals(1, menu.get(0).products().size());
        assertEquals("Latte", menu.get(0).products().get(0).name());
        assertEquals(1, menu.get(0).products().get(0).variants().size());
        assertEquals(10, menu.get(0).products().get(0).variants().get(0).availableQuantity());

        verify(categoryRepository, times(1)).findAll();
        verify(inventoryRepository, times(1)).findByVariantId(variant.getId());
    }

    @Test
    void getMenu_FiltersInactiveCategories() {
        category.setActive(false);
        when(categoryRepository.findAll()).thenReturn(List.of(category));

        List<MenuCategoryResponse> menu = menuService.getMenu();

        assertTrue(menu.isEmpty());
    }

    @Test
    void getMenu_FiltersInactiveProducts() {
        product.setStatus(ProductStatus.INACTIVE);
        when(categoryRepository.findAll()).thenReturn(List.of(category));

        List<MenuCategoryResponse> menu = menuService.getMenu();

        assertEquals(1, menu.size());
        assertTrue(menu.get(0).products().isEmpty());
    }

    @Test
    void getMenu_HandlesMissingInventory_ReturnsZeroQuantity() {
        when(categoryRepository.findAll()).thenReturn(List.of(category));
        when(inventoryRepository.findByVariantId(variant.getId())).thenReturn(Optional.empty());

        List<MenuCategoryResponse> menu = menuService.getMenu();

        assertEquals(1, menu.size());
        assertEquals(0, menu.get(0).products().get(0).variants().get(0).availableQuantity());
    }
}
