package brewops_backend.payment.repository;

import brewops_backend.payment.entity.PaymentEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentEventRepository extends JpaRepository<PaymentEvent, UUID> {

    boolean existsByProviderEventId(String providerEventId);

    Optional<PaymentEvent> findByProviderEventId(String providerEventId);
}
