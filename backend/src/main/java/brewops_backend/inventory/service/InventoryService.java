package brewops_backend.inventory.service;

import brewops_backend.catalog.entity.ProductStatus;
import brewops_backend.catalog.entity.ProductVariant;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.entity.InventoryMovement;
import brewops_backend.inventory.entity.InventoryMovementType;
import brewops_backend.inventory.repository.InventoryMovementRepository;
import brewops_backend.inventory.repository.InventoryRepository;
import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    public void reserveForOrder(Order order) {
        List<OrderItem> sortedItems = order.getItems().stream()
                .sorted(Comparator.comparing(item -> item.getVariant().getId()))
                .toList();

        for (OrderItem item : sortedItems) {
            ProductVariant variant = item.getVariant();
            validateVariantSellable(variant);

            Inventory inventory = inventoryRepository.findWithLockByVariantId(variant.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Inventory not found for " + variant.getSku()));

            if (inventory.getAvailableQuantity() < item.getQuantity()) {
                throw new IllegalArgumentException("Insufficient inventory for " + variant.getSku());
            }

            inventory.setAvailableQuantity(inventory.getAvailableQuantity() - item.getQuantity());
            inventory.setReservedQuantity(inventory.getReservedQuantity() + item.getQuantity());
            inventoryRepository.save(inventory);

            recordMovement(inventory, order, InventoryMovementType.RESERVED, item.getQuantity(), "Order reserved");
        }
    }

    public void commitForOrder(Order order) {
        for (OrderItem item : sortedItemsByVariantId(order)) {
            Inventory inventory = inventoryRepository.findWithLockByVariantId(item.getVariant().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Inventory not found"));

            if (inventory.getReservedQuantity() < item.getQuantity()) {
                throw new IllegalStateException("Reserved quantity mismatch for " + item.getVariant().getSku());
            }

            inventory.setReservedQuantity(inventory.getReservedQuantity() - item.getQuantity());
            inventoryRepository.save(inventory);

            recordMovement(inventory, order, InventoryMovementType.STOCK_OUT, item.getQuantity(), "Payment confirmed");
        }
    }

    public void releaseForOrder(Order order) {
        for (OrderItem item : sortedItemsByVariantId(order)) {
            Inventory inventory = inventoryRepository.findWithLockByVariantId(item.getVariant().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Inventory not found"));

            if (inventory.getReservedQuantity() < item.getQuantity()) {
                throw new IllegalStateException("Reserved quantity mismatch for " + item.getVariant().getSku());
            }

            inventory.setAvailableQuantity(inventory.getAvailableQuantity() + item.getQuantity());
            inventory.setReservedQuantity(inventory.getReservedQuantity() - item.getQuantity());
            inventoryRepository.save(inventory);

            recordMovement(inventory, order, InventoryMovementType.RELEASED, item.getQuantity(), "Reservation released");
        }
    }

    private List<OrderItem> sortedItemsByVariantId(Order order) {
        return order.getItems().stream()
                .sorted(Comparator.comparing(item -> item.getVariant().getId()))
                .toList();
    }

    private void validateVariantSellable(ProductVariant variant) {
        if (!Boolean.TRUE.equals(variant.getActive())) {
            throw new IllegalArgumentException("Variant is not active: " + variant.getSku());
        }
        if (variant.getProduct().getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalArgumentException("Product is not active: " + variant.getProduct().getName());
        }
    }

    public Optional<Inventory> findByVariantId(UUID variantId) {
        return inventoryRepository.findByVariantId(variantId);
    }

    public void restockForOrder(Order order, String reason) {
        for (OrderItem item : sortedItemsByVariantId(order)) {
            Inventory inventory = inventoryRepository.findWithLockByVariantId(item.getVariant().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Inventory not found"));
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() + item.getQuantity());
            inventoryRepository.save(inventory);
            recordMovement(inventory, order, InventoryMovementType.STOCK_IN, item.getQuantity(), reason);
        }
    }

    public void recordAdjustment(
            Inventory inventory,
            int quantity,
            InventoryMovementType type,
            String reason
    ) {
        recordMovement(inventory, null, type, quantity, reason);
    }

    private void recordMovement(
            Inventory inventory,
            Order order,
            InventoryMovementType type,
            int quantity,
            String reason
    ) {
        InventoryMovement movement = new InventoryMovement();
        movement.setInventory(inventory);
        movement.setOrder(order);
        movement.setMovementType(type);
        movement.setQuantity(quantity);
        movement.setReason(reason);
        inventoryMovementRepository.save(movement);
    }
}
