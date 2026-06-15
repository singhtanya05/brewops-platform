package brewops_backend.catalog.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import brewops_backend.catalog.entity.Product;

public interface ProductRepository extends JpaRepository<Product,UUID> {
    
}
