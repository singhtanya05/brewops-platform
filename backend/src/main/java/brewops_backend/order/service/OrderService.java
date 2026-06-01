package brewops_backend.order.service;

import brewops_backend.inventory.entity.Inventory;
import brewops_backend.inventory.repository.InventoryRepository;
import brewops_backend.order.dto.CreateOrderRequest;
import brewops_backend.order.dto.OrderResponse;
import brewops_backend.order.entity.Cart;
import brewops_backend.order.entity.CartItem;
import brewops_backend.order.entity.Order;
import brewops_backend.order.entity.OrderItem;
import brewops_backend.order.entity.OrderStatus;
import brewops_backend.order.repository.CartRepository;
import brewops_backend.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

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

        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {

            Inventory inventory = inventoryRepository.findWithLockByVariantId(cartItem.getVariant().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Inventory not found"));

            if (inventory.getAvailableQuantity() < cartItem.getQuantity()) {
                throw new IllegalArgumentException("Insufficient inventory for " + cartItem.getVariant().getSku());
            }

            inventory.setAvailableQuantity(inventory.getAvailableQuantity() - cartItem.getQuantity());
            inventory.setReservedQuantity(inventory.getReservedQuantity() + cartItem.getQuantity());

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

        cart.setActive(false);

        Order savedOrder = orderRepository.save(order);

        return new OrderResponse(
                savedOrder.getId(),
                savedOrder.getOrderNumber(),
                savedOrder.getStatus().name(),
                savedOrder.getTotalAmount()
        );
    }

    private String generateOrderNumber() {
        return "BO-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
    }
}
