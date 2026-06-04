package brewops_backend.kitchen.service;

import brewops_backend.kitchen.dto.KitchenOrderItemResponse;
import brewops_backend.kitchen.dto.KitchenOrderResponse;
import brewops_backend.kitchen.dto.UpdateKitchenOrderStatusRequest;
import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderItem;
import brewops_backend.order.entity.OrderStatus;
import brewops_backend.order.repository.OrderRepository;
import brewops_backend.order.service.OrderLifecycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KitchenOrderService {

    private static final List<OrderStatus> QUEUE_STATUSES = List.of(
            OrderStatus.PAID, OrderStatus.PREPARING
    );

    private final OrderRepository orderRepository;
    private final OrderLifecycleService orderLifecycleService;

    @Transactional(readOnly = true)
    public List<KitchenOrderResponse> getQueue(String statusParam) {
        List<OrderStatus> statuses;
        if (statusParam == null || statusParam.isBlank()) {
            statuses = QUEUE_STATUSES;
        } else {
            statuses = Arrays.stream(statusParam.split(","))
                    .map(String::trim)
                    .map(OrderStatus::valueOf)
                    .collect(Collectors.toList());
        }

        return orderRepository.findByStatusInOrderByCreatedAtAsc(statuses).stream()
                .map(this::mapOrder)
                .toList();
    }

    @Transactional
    public KitchenOrderResponse updateStatus(UUID orderId, UpdateKitchenOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        OrderStatus newStatus = OrderStatus.valueOf(request.status());
        String reason = "Kitchen status update";

        switch (newStatus) {
            case PREPARING -> orderLifecycleService.transition(order, OrderStatus.PREPARING, reason);
            case READY -> orderLifecycleService.transition(order, OrderStatus.READY, reason);
            case COMPLETED -> orderLifecycleService.transition(order, OrderStatus.COMPLETED, reason);
            default -> throw new IllegalArgumentException("Kitchen cannot set status to " + newStatus);
        }

        orderRepository.save(order);
        return mapOrder(order);
    }

    private KitchenOrderResponse mapOrder(Order order) {
        List<KitchenOrderItemResponse> items = order.getItems().stream()
                .map(this::mapItem)
                .toList();

        return new KitchenOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getCreatedAt(),
                items
        );
    }

    private KitchenOrderItemResponse mapItem(OrderItem item) {
        return new KitchenOrderItemResponse(
                item.getProductName(),
                item.getVariantName(),
                item.getQuantity(),
                null
        );
    }
}
