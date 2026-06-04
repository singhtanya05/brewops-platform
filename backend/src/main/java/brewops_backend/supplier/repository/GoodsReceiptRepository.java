package brewops_backend.supplier.repository;

import brewops_backend.supplier.entity.GoodsReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, UUID> {
}
