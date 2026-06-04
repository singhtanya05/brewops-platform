package brewops_backend.order.repository;

import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByStatusInOrderByCreatedAtAsc(List<OrderStatus> statuses);

    List<Order> findByStatusAndUpdatedAtBefore(OrderStatus status, LocalDateTime updatedAtBefore);
}
