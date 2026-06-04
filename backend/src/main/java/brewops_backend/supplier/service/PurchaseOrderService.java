package brewops_backend.supplier.service;

import brewops_backend.catalog.entity.ProductVariant;
import brewops_backend.catalog.repository.ProductVariantRepository;
import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.entity.InventoryMovementType;
import brewops_backend.inventory.repository.InventoryRepository;
import brewops_backend.inventory.service.InventoryService;
import brewops_backend.supplier.entity.*;
import brewops_backend.supplier.repository.GoodsReceiptRepository;
import brewops_backend.supplier.repository.PurchaseOrderRepository;
import brewops_backend.supplier.repository.SupplierRepository;
import brewops_backend.user.entity.User;
import brewops_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    @Transactional
    public PurchaseOrder createPurchaseOrder(UUID supplierId, String poNumber, List<PurchaseOrderItem> orderItems) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        if (purchaseOrderRepository.findByPoNumber(poNumber).isPresent()) {
            throw new IllegalArgumentException("Purchase Order with this PO number already exists");
        }

        PurchaseOrder po = new PurchaseOrder();
        po.setSupplier(supplier);
        po.setPoNumber(poNumber);
        po.setStatus(PurchaseOrderStatus.DRAFT);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<PurchaseOrderItem> items = new ArrayList<>();

        for (PurchaseOrderItem inputItem : orderItems) {
            ProductVariant variant = productVariantRepository.findById(inputItem.getVariant().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Product variant not found"));

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(po);
            item.setVariant(variant);
            item.setQuantity(inputItem.getQuantity());
            item.setUnitCost(inputItem.getUnitCost());
            
            BigDecimal lineTotal = inputItem.getUnitCost()
                    .multiply(BigDecimal.valueOf(inputItem.getQuantity()));
            item.setLineTotal(lineTotal);

            items.add(item);
            totalAmount = totalAmount.add(lineTotal);
        }

        po.setItems(items);
        po.setTotalAmount(totalAmount);

        return purchaseOrderRepository.save(po);
    }

    @Transactional
    public PurchaseOrder orderPurchaseOrder(UUID poId) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));

        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("PO can only be ordered from DRAFT status");
        }

        po.setStatus(PurchaseOrderStatus.ORDERED);
        return purchaseOrderRepository.save(po);
    }

    @Transactional
    public PurchaseOrder receivePurchaseOrder(UUID poId, UUID receivedByUserId, String notes) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));

        if (po.getStatus() != PurchaseOrderStatus.ORDERED) {
            throw new IllegalStateException("PO can only be received from ORDERED status");
        }

        User user = null;
        if (receivedByUserId != null) {
            user = userRepository.findById(receivedByUserId).orElse(null);
        }

        // 1. Create Goods Receipt
        GoodsReceipt receipt = new GoodsReceipt();
        receipt.setPurchaseOrder(po);
        receipt.setReceivedAt(LocalDateTime.now());
        receipt.setReceivedByUser(user);
        receipt.setNotes(notes);
        goodsReceiptRepository.save(receipt);

        // 2. Adjust inventory for all PO items
        for (PurchaseOrderItem item : po.getItems()) {
            Inventory inventory = inventoryRepository.findWithLockByVariantId(item.getVariant().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Inventory record not found for variant"));

            // Increase available stock
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() + item.getQuantity());
            inventoryRepository.save(inventory);

            // Record adjustment movement (STOCK_IN)
            inventoryService.recordAdjustment(
                    inventory,
                    item.getQuantity(),
                    InventoryMovementType.STOCK_IN,
                    "PO Restock: " + po.getPoNumber()
            );
        }

        po.setStatus(PurchaseOrderStatus.RECEIVED);
        return purchaseOrderRepository.save(po);
    }

    @Transactional(readOnly = true)
    public PurchaseOrder getPurchaseOrder(UUID poId) {
        return purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));
    }
}
