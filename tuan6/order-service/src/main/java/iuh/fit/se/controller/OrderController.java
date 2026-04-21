package iuh.fit.se.controller;

import iuh.fit.se.dto.OrderRequest;
import iuh.fit.se.dto.OrderResponse;
import iuh.fit.se.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class OrderController {

    private final OrderService orderService;

    // POST /orders → tạo đơn hàng
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request) {
        log.info("Received request to create order for user: {}", request.getUserId());
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    // GET /orders → lấy tất cả, hoặc lọc theo userId (String/UUID)
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(
            @RequestParam(required = false) String userId) {
        log.info("Received request to get all orders (user filter: {})", userId);
        if (userId != null) {
            return ResponseEntity.ok(orderService.getOrdersByUser(userId));
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // GET /orders/{id} → lấy theo ID
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        log.info("Received request to get order by ID: {}", id);
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    // PATCH /orders/{id}/status → cập nhật trạng thái (Payment Service gọi)
    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        log.info("Received request to update order {} status to: {}", id, status);
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }
}