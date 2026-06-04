package brewops_backend.supplier.service;

import brewops_backend.supplier.entity.Supplier;
import brewops_backend.supplier.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        if (supplierRepository.findByName(supplier.getName()).isPresent()) {
            throw new IllegalArgumentException("Supplier with this name already exists");
        }
        return supplierRepository.save(supplier);
    }

    @Transactional(readOnly = true)
    public Supplier getSupplier(UUID id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
    }

    @Transactional(readOnly = true)
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Transactional
    public Supplier updateSupplier(UUID id, Supplier details) {
        Supplier supplier = getSupplier(id);
        supplier.setName(details.getName());
        supplier.setContactName(details.getContactName());
        supplier.setEmail(details.getEmail());
        supplier.setPhone(details.getPhone());
        supplier.setActive(details.getActive());
        return supplierRepository.save(supplier);
    }
}
