package brewops_backend.order.service;

import brewops_backend.common.exception.InvalidOrderStateException;
import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderStatus;
import brewops_backend.order.entity.OrderStatusHistory;
import brewops_backend.order.repository.OrderStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderLifecycleService {

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = Map.of(
            OrderStatus.PENDING, EnumSet.of(OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED),
            OrderStatus.PAYMENT_PENDING, EnumSet.of(OrderStatus.PAID, OrderStatus.FAILED, OrderStatus.CANCELLED),
            OrderStatus.PAID, EnumSet.of(OrderStatus.PREPARING, OrderStatus.REFUNDED, OrderStatus.CANCELLED),
            OrderStatus.PREPARING, EnumSet.of(OrderStatus.READY, OrderStatus.CANCELLED),
            OrderStatus.READY, EnumSet.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
            OrderStatus.FAILED, EnumSet.of(OrderStatus.CANCELLED),
            OrderStatus.COMPLETED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.REFUNDED, EnumSet.noneOf(OrderStatus.class)
    );

    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final brewops_backend.kitchen.service.KitchenSseService kitchenSseService;

    public void transition(Order order, OrderStatus newStatus, String reason) {
        transition(order, newStatus, reason, null);
    }

    public void transition(Order order, OrderStatus newStatus, String reason, UUID changedByUserId) {
        OrderStatus current = order.getStatus();

        if (current == newStatus) {
            return;
        }

        Set<OrderStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(current, EnumSet.noneOf(OrderStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new InvalidOrderStateException(
                    "Cannot transition order from " + current + " to " + newStatus
            );
        }

        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setOldStatus(current);
        history.setNewStatus(newStatus);
        history.setReason(reason);
        history.setChangedByUserId(changedByUserId);
        orderStatusHistoryRepository.save(history);

        order.setStatus(newStatus);

        if (newStatus == OrderStatus.PAID || newStatus == OrderStatus.PREPARING || newStatus == OrderStatus.READY || newStatus == OrderStatus.COMPLETED) {
            kitchenSseService.broadcastKitchenUpdate();
        }
    }
}
