package brewops_backend.order.service;

import brewops_backend.inventory.service.InventoryService;
import brewops_backend.order.dto.CreateOrderRequest;
import brewops_backend.order.dto.OrderDetailResponse;
import brewops_backend.order.dto.OrderItemDetailResponse;
import brewops_backend.order.dto.OrderResponse;
import brewops_backend.order.entity.Cart;
import brewops_backend.order.entity.CartItem;
import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderItem;
import brewops_backend.order.entity.OrderStatus;
import brewops_backend.order.repository.CartRepository;
import brewops_backend.order.repository.OrderRepository;
import brewops_backend.user.entity.User;
import brewops_backend.user.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {

        Cart cart = cartRepository.findBySessionIdAndActiveTrue(request.sessionId())
                .orElseThrow(() -> new IllegalArgumentException("Active cart not found"));

        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setStatus(OrderStatus.PENDING);
        order.setCurrency("INR");

        UUID authUserId = getAuthenticatedUserId();
        if (authUserId != null) {
            userRepository.findById(authUserId).ifPresent(order::setUser);
        } else if (cart.getUser() != null) {
            order.setUser(cart.getUser());
        }

        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setVariant(cartItem.getVariant());
            orderItem.setProductName(cartItem.getVariant().getProduct().getName());
            orderItem.setVariantName(cartItem.getVariant().getName());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(cartItem.getUnitPrice());

            BigDecimal lineTotal = cartItem.getUnitPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            orderItem.setLineTotal(lineTotal);
            order.getItems().add(orderItem);
            subtotal = subtotal.add(lineTotal);
        }

        order.setSubtotal(subtotal);
        order.setTaxAmount(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal);

        inventoryService.reserveForOrder(order);

        cart.setActive(false);

        Order savedOrder = orderRepository.save(order);

        return new OrderResponse(
                savedOrder.getId(),
                savedOrder.getOrderNumber(),
                savedOrder.getStatus().name(),
                savedOrder.getTotalAmount()
        );
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        List<OrderItemDetailResponse> items = order.getItems().stream()
                .map(item -> new OrderItemDetailResponse(
                        item.getId(),
                        item.getVariant().getId(),
                        item.getProductName(),
                        item.getVariantName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal()
                ))
                .toList();

        return new OrderDetailResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus().name(),
                order.getSubtotal(),
                order.getTaxAmount(),
                order.getDiscountAmount(),
                order.getTotalAmount(),
                order.getCurrency(),
                items
        );
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderStatus(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus().name(),
                order.getTotalAmount()
        );
    }

    private String generateOrderNumber() {
        return "BO-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
    }

    private UUID getAuthenticatedUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof UUID userId) {
            return userId;
        }
        return null;
    }
}
