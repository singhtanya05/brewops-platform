package brewops_backend.order.repository;

import brewops_backend.order.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CartRepository extends JpaRepository<Cart, UUID> {

    Optional<Cart> findBySessionIdAndActiveTrue(String sessionId);
}
