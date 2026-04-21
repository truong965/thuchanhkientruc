package iuh.fit.se.controller;

import iuh.fit.se.dto.FoodRequest;
import iuh.fit.se.dto.FoodResponse;
import iuh.fit.se.service.FoodService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/foods")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Cho phép Frontend gọi sang
@Slf4j
public class FoodController {

    private final FoodService foodService;

    // GET /foods → lấy tất cả
    @GetMapping
    public ResponseEntity<List<FoodResponse>> getAllFoods(
            @RequestParam(required = false) Boolean available) {
        log.info("Received request to get all foods (available only: {})", available);
        if (Boolean.TRUE.equals(available)) {
            return ResponseEntity.ok(foodService.getAvailableFoods());
        }
        return ResponseEntity.ok(foodService.getAllFoods());
    }

    // GET /foods/{id} → lấy theo ID (Order Service dùng)
    @GetMapping("/{id}")
    public ResponseEntity<FoodResponse> getFoodById(@PathVariable Long id) {
        log.info("Received request to get food by ID: {}", id);
        return ResponseEntity.ok(foodService.getFoodById(id));
    }

    // POST /foods → thêm món (ADMIN)
    @PostMapping
    public ResponseEntity<FoodResponse> createFood(@RequestBody FoodRequest request) {
        log.info("Received request to create food: {}", request.getName());
        return ResponseEntity.ok(foodService.createFood(request));
    }

    // PUT /foods/{id} → sửa món (ADMIN)
    @PutMapping("/{id}")
    public ResponseEntity<FoodResponse> updateFood(
            @PathVariable Long id,
            @RequestBody FoodRequest request) {
        log.info("Received request to update food ID {}: {}", id, request.getName());
        return ResponseEntity.ok(foodService.updateFood(id, request));
    }

    // DELETE /foods/{id} → xóa món (ADMIN)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFood(@PathVariable Long id) {
        log.info("Received request to delete food ID: {}", id);
        foodService.deleteFood(id);
        return ResponseEntity.noContent().build();
    }
}