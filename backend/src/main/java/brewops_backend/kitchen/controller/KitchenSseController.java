package brewops_backend.kitchen.controller;

import brewops_backend.kitchen.service.KitchenSseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/kitchen/stream")
public class KitchenSseController {

    private final KitchenSseService kitchenSseService;

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamKitchenOrders() {
        return kitchenSseService.createEmitter();
    }
}
