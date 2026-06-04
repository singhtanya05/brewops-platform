package brewops_backend.payment.client;

import brewops_backend.payment.config.StripeProperties;
import brewops_backend.payment.entity.Payment;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
@Slf4j
@Component
@RequiredArgsConstructor
public class StripePaymentClient {

    private final StripeProperties stripeProperties;

    public void createPaymentIntent(Payment payment) {
        if (!stripeProperties.isConfigured()) {
            log.debug("Stripe not configured; skipping PaymentIntent creation");
            return;
        }

        Stripe.apiKey = stripeProperties.apiKey();

        long amountMinor = toMinorUnits(payment.getAmount(), payment.getCurrency());

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountMinor)
                    .setCurrency(payment.getCurrency().toLowerCase())
                    .putMetadata("orderId", payment.getOrder().getId().toString())
                    .putMetadata("paymentId", payment.getId() != null ? payment.getId().toString() : "")
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);
            payment.setProviderPaymentIntentId(intent.getId());
            payment.setClientSecret(intent.getClientSecret());
        } catch (StripeException e) {
            throw new IllegalStateException("Failed to create Stripe PaymentIntent: " + e.getMessage(), e);
        }
    }

    public void refund(Payment payment) {
        if (!stripeProperties.isConfigured()) {
            log.debug("Stripe not configured; skipping refund");
            return;
        }

        if (payment.getProviderPaymentIntentId() == null) {
            return;
        }

        Stripe.apiKey = stripeProperties.apiKey();

        try {
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(payment.getProviderPaymentIntentId())
                    .build();
            Refund refund = Refund.create(params);
            payment.setProviderChargeId(refund.getId());
        } catch (StripeException e) {
            throw new IllegalStateException("Failed to refund Stripe payment: " + e.getMessage(), e);
        }
    }

    private long toMinorUnits(BigDecimal amount, String currency) {
        int fractionDigits = "INR".equalsIgnoreCase(currency) ? 2 : 2;
        return amount.movePointRight(fractionDigits).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
}
