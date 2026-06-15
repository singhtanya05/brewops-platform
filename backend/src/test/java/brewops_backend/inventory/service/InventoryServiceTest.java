package brewops_backend.inventory.service;

import brewops_backend.catalog.entity.Product;
import brewops_backend.catalog.entity.ProductStatus;
import brewops_backend.catalog.entity.ProductVariant;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.entity.InventoryMovement;
import brewops_backend.inventory.entity.InventoryMovementType;
import brewops_backend.inventory.repository.InventoryMovementRepository;
import brewops_backend.inventory.repository.InventoryRepository;
import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryMovementRepository inventoryMovementRepository;

    @InjectMocks
    private InventoryService inventoryService;

    @Captor
    private ArgumentCaptor<InventoryMovement> movementCaptor;

    private Order order;
    private OrderItem orderItem;
    private ProductVariant variant;
    private Inventory inventory;

    @BeforeEach
    void setUp() {
        variant = new ProductVariant();
        variant.setId(UUID.randomUUID());
        variant.setSku("TEST-SKU");
        variant.setActive(true);

        Product product = new Product();
        product.setStatus(ProductStatus.ACTIVE);
        variant.setProduct(product);

        orderItem = new OrderItem();
        orderItem.setVariant(variant);
        orderItem.setQuantity(2);

        order = new Order();
        order.setId(UUID.randomUUID());
        order.setItems(List.of(orderItem));

        inventory = new Inventory();
        inventory.setVariant(variant);
        inventory.setAvailableQuantity(10);
        inventory.setReservedQuantity(0);
    }

    @Test
    void reserveForOrder_HappyPath_UpdatesInventoryAndRecordsMovement() {
        when(inventoryRepository.findWithLockByVariantId(variant.getId())).thenReturn(Optional.of(inventory));

        inventoryService.reserveForOrder(order);

        assertEquals(8, inventory.getAvailableQuantity());
        assertEquals(2, inventory.getReservedQuantity());

        verify(inventoryRepository).save(inventory);
        verify(inventoryMovementRepository).save(movementCaptor.capture());

        InventoryMovement movement = movementCaptor.getValue();
        assertEquals(InventoryMovementType.RESERVED, movement.getMovementType());
        assertEquals(2, movement.getQuantity());
        assertEquals(order, movement.getOrder());
    }

    @Test
    void reserveForOrder_ThrowsException_IfVariantInactive() {
        variant.setActive(false);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> inventoryService.reserveForOrder(order));
        assertEquals("Variant is not active: TEST-SKU", exception.getMessage());
    }

    @Test
    void reserveForOrder_ThrowsException_IfProductInactive() {
        variant.getProduct().setStatus(ProductStatus.INACTIVE);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> inventoryService.reserveForOrder(order));
        assertEquals("Product is not active: null", exception.getMessage());
    }

    @Test
    void reserveForOrder_ThrowsException_IfInsufficientInventory() {
        inventory.setAvailableQuantity(1); // Needs 2
        when(inventoryRepository.findWithLockByVariantId(variant.getId())).thenReturn(Optional.of(inventory));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> inventoryService.reserveForOrder(order));
        assertEquals("Insufficient inventory for TEST-SKU", exception.getMessage());
    }

    @Test
    void commitForOrder_HappyPath_DeductsReservedAndRecordsMovement() {
        inventory.setReservedQuantity(2);
        when(inventoryRepository.findWithLockByVariantId(variant.getId())).thenReturn(Optional.of(inventory));

        inventoryService.commitForOrder(order);

        assertEquals(0, inventory.getReservedQuantity()); // Reserved goes down
        assertEquals(10, inventory.getAvailableQuantity()); // Available stays same

        verify(inventoryRepository).save(inventory);
        verify(inventoryMovementRepository).save(movementCaptor.capture());

        InventoryMovement movement = movementCaptor.getValue();
        assertEquals(InventoryMovementType.STOCK_OUT, movement.getMovementType());
    }

    @Test
    void releaseForOrder_HappyPath_RevertsReservedBackToAvailable() {
        inventory.setAvailableQuantity(8);
        inventory.setReservedQuantity(2);
        when(inventoryRepository.findWithLockByVariantId(variant.getId())).thenReturn(Optional.of(inventory));

        inventoryService.releaseForOrder(order);

        assertEquals(10, inventory.getAvailableQuantity()); // Returned to pool
        assertEquals(0, inventory.getReservedQuantity()); // Reservation cleared

        verify(inventoryRepository).save(inventory);
        verify(inventoryMovementRepository).save(movementCaptor.capture());

        InventoryMovement movement = movementCaptor.getValue();
        assertEquals(InventoryMovementType.RELEASED, movement.getMovementType());
    }

    @Test
    void restockForOrder_HappyPath_IncreasesAvailableStock() {
        when(inventoryRepository.findWithLockByVariantId(variant.getId())).thenReturn(Optional.of(inventory));

        inventoryService.restockForOrder(order, "Refunded");

        assertEquals(12, inventory.getAvailableQuantity());

        verify(inventoryRepository).save(inventory);
        verify(inventoryMovementRepository).save(movementCaptor.capture());

        InventoryMovement movement = movementCaptor.getValue();
        assertEquals(InventoryMovementType.STOCK_IN, movement.getMovementType());
        assertEquals("Refunded", movement.getReason());
    }
}
