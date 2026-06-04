package brewops_backend.user.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "brewops.jwt")
public record JwtProperties(
        String secret,
        long expirationMs
) {}
