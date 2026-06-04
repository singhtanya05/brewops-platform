package brewops_backend.supplier.controller;

import brewops_backend.supplier.dto.CreateSupplierRequest;
import brewops_backend.supplier.entity.Supplier;
import brewops_backend.supplier.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    @PostMapping
    public Supplier createSupplier(@Valid @RequestBody CreateSupplierRequest request) {
        Supplier supplier = new Supplier();
        supplier.setName(request.name());
        supplier.setContactName(request.contactName());
        supplier.setEmail(request.email());
        supplier.setPhone(request.phone());
        return supplierService.createSupplier(supplier);
    }

    @GetMapping("/{id}")
    public Supplier getSupplier(@PathVariable UUID id) {
        return supplierService.getSupplier(id);
    }

    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierService.getAllSuppliers();
    }
}
