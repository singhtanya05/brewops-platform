package brewops_backend.payment.service;

import brewops_backend.payment.config.StripeProperties;
import brewops_backend.payment.entity.Payment;
import brewops_backend.payment.entity.PaymentEvent;
import brewops_backend.payment.entity.PaymentProvider;
import brewops_backend.payment.repository.PaymentEventRepository;
import brewops_backend.payment.repository.PaymentRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StripeWebhookService {

    private final StripeProperties stripeProperties;
    private final PaymentEventRepository paymentEventRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        if (!stripeProperties.isConfigured()
                || stripeProperties.webhookSecret() == null
                || stripeProperties.webhookSecret().isBlank()) {
            throw new IllegalStateException("Stripe webhooks are not configured");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, stripeProperties.webhookSecret());
        } catch (SignatureVerificationException e) {
            throw new IllegalArgumentException("Invalid Stripe webhook signature");
        }

        if (paymentEventRepository.existsByProviderEventId(event.getId())) {
            return;
        }

        PaymentEvent paymentEvent = new PaymentEvent();
        paymentEvent.setProvider(PaymentProvider.STRIPE);
        paymentEvent.setProviderEventId(event.getId());
        paymentEvent.setEventType(event.getType());
        paymentEvent.setPayload(payload);
        paymentEventRepository.save(paymentEvent);

        switch (event.getType()) {
            case "payment_intent.succeeded" -> handlePaymentIntentSucceeded(event, paymentEvent);
            case "payment_intent.payment_failed" -> handlePaymentIntentFailed(event, paymentEvent);
            default -> paymentEvent.setProcessed(true);
        }

        paymentEvent.setProcessedAt(LocalDateTime.now());
        paymentEventRepository.save(paymentEvent);
    }

    private void handlePaymentIntentSucceeded(Event event, PaymentEvent paymentEvent) {
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new IllegalStateException("PaymentIntent not found in event"));

        Payment payment = findPayment(intent);
        paymentEvent.setPayment(payment);
        payment.setProviderPaymentIntentId(intent.getId());
        if (intent.getLatestCharge() != null) {
            payment.setProviderChargeId(intent.getLatestCharge());
        }
        paymentRepository.save(payment);

        paymentService.completePayment(payment.getId());
        paymentEvent.setProcessed(true);
    }

    private void handlePaymentIntentFailed(Event event, PaymentEvent paymentEvent) {
        PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new IllegalStateException("PaymentIntent not found in event"));

        Payment payment = findPayment(intent);
        paymentEvent.setPayment(payment);

        String reason = intent.getLastPaymentError() != null
                ? intent.getLastPaymentError().getMessage()
                : "Payment failed";

        paymentService.failPayment(payment.getId(), reason);
        paymentEvent.setProcessed(true);
    }

    private Payment findPayment(PaymentIntent intent) {
        String paymentId = intent.getMetadata().get("paymentId");
        if (paymentId != null && !paymentId.isBlank()) {
            return paymentRepository.findById(UUID.fromString(paymentId))
                    .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        }
        return paymentRepository.findByProviderPaymentIntentId(intent.getId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for intent"));
    }
}
