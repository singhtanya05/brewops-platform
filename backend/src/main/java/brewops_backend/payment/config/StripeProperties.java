package brewops_backend.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "brewops.stripe")
public record StripeProperties(
        String apiKey,
        String webhookSecret,
        boolean enabled
) {
    public boolean isConfigured() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }
}
