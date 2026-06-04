package brewops_backend.supplier.controller;

import brewops_backend.catalog.entity.ProductVariant;
import brewops_backend.supplier.dto.CreatePurchaseOrderRequest;
import brewops_backend.supplier.dto.ReceivePurchaseOrderRequest;
import brewops_backend.supplier.entity.PurchaseOrder;
import brewops_backend.supplier.entity.PurchaseOrderItem;
import brewops_backend.supplier.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    public PurchaseOrder createPurchaseOrder(@Valid @RequestBody CreatePurchaseOrderRequest request) {
        List<PurchaseOrderItem> items = request.items().stream()
                .map(reqItem -> {
                    PurchaseOrderItem item = new PurchaseOrderItem();
                    ProductVariant variant = new ProductVariant();
                    variant.setId(reqItem.variantId());
                    item.setVariant(variant);
                    item.setQuantity(reqItem.quantity());
                    item.setUnitCost(reqItem.unitCost());
                    return item;
                })
                .toList();

        return purchaseOrderService.createPurchaseOrder(
                request.supplierId(),
                request.poNumber(),
                items
        );
    }

    @PostMapping("/{id}/order")
    public PurchaseOrder orderPurchaseOrder(@PathVariable UUID id) {
        return purchaseOrderService.orderPurchaseOrder(id);
    }

    @PostMapping("/{id}/receive")
    public PurchaseOrder receivePurchaseOrder(
            @PathVariable UUID id,
            @RequestBody ReceivePurchaseOrderRequest request
    ) {
        return purchaseOrderService.receivePurchaseOrder(
                id,
                request.receivedByUserId(),
                request.notes()
        );
    }

    @GetMapping("/{id}")
    public PurchaseOrder getPurchaseOrder(@PathVariable UUID id) {
        return purchaseOrderService.getPurchaseOrder(id);
    }
}
