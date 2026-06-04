package brewops_backend.payment.service;

import brewops_backend.common.exception.IdempotencyConflictException;
import brewops_backend.payment.dto.PaymentResponse;
import brewops_backend.payment.entity.IdempotencyKey;
import brewops_backend.payment.repository.IdempotencyKeyRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final ObjectMapper objectMapper;

    public String hashRequest(UUID orderId, String idempotencyKey) {
        String raw = orderId + ":" + idempotencyKey;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public Optional<PaymentResponse> findExisting(String key, String requestHash) {
        Optional<IdempotencyKey> record = idempotencyKeyRepository.findByIdempotencyKey(key);
        if (record.isEmpty()) {
            return Optional.empty();
        }
        if (!record.get().getRequestHash().equals(requestHash)) {
            throw new IdempotencyConflictException(
                    "Idempotency key already used with a different request"
            );
        }
        if (record.get().getResponsePayload() == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(record.get().getResponsePayload(), PaymentResponse.class));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize idempotent response", e);
        }
    }

    public void store(String key, String requestHash, PaymentResponse response) {
        if (idempotencyKeyRepository.findByIdempotencyKey(key).isPresent()) {
            return;
        }
        try {
            IdempotencyKey record = new IdempotencyKey();
            record.setIdempotencyKey(key);
            record.setRequestHash(requestHash);
            record.setResponsePayload(objectMapper.writeValueAsString(response));
            record.setStatusCode(200);
            idempotencyKeyRepository.save(record);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize payment response", e);
        }
    }
}
