package brewops_backend.payment.controller;

import brewops_backend.payment.dto.CreatePaymentRequest;
import brewops_backend.payment.dto.FailPaymentRequest;
import brewops_backend.payment.dto.PaymentResponse;
import brewops_backend.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public PaymentResponse createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        return paymentService.createPayment(request);
    }

    @GetMapping("/{id}")
    public PaymentResponse getPayment(@PathVariable UUID id) {
        return paymentService.getPayment(id);
    }

    @Profile("dev")
    @PostMapping("/{id}/complete")
    public PaymentResponse completePayment(@PathVariable UUID id) {
        return paymentService.completePayment(id);
    }

    @Profile("dev")
    @PostMapping("/{id}/fail")
    public PaymentResponse failPayment(
            @PathVariable UUID id,
            @Valid @RequestBody FailPaymentRequest request
    ) {
        return paymentService.failPayment(id, request.reason());
    }

    @PostMapping("/{id}/refund")
    public PaymentResponse refundPayment(
            @PathVariable UUID id,
            @RequestBody(required = false) FailPaymentRequest request
    ) {
        String reason = request != null ? request.reason() : "Customer refund";
        return paymentService.refundPayment(id, reason);
    }
}
