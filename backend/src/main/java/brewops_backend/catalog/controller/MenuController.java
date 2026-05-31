package brewops_backend.catalog.controller;

import brewops_backend.catalog.dto.MenuCategoryResponse;
import brewops_backend.catalog.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/menu")
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    public List<MenuCategoryResponse> getMenu() {
        return menuService.getMenu();
    }
}
