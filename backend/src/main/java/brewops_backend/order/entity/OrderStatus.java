package brewops_backend.order.entity;

public enum OrderStatus {
    PENDING,
    PAYMENT_PENDING,
    PAID,
    PREPARING,
    READY,
    COMPLETED,
    CANCELLED,
    FAILED,
    REFUNDED
}
