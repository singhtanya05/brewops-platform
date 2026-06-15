package brewops_backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/logs")
public class ClientLogController {

    private static final Logger log = LoggerFactory.getLogger(ClientLogController.class);

    @PostMapping("/client")
    public ResponseEntity<Void> logClientError(@RequestBody Map<String, Object> payload) {
        // We log the payload to the standard output so ELK/Datadog picks it up
        log.error("FRONTEND_ERROR: {}", payload);
        return ResponseEntity.ok().build();
    }
}
