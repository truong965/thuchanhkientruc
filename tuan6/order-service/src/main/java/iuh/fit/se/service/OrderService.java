package iuh.fit.se.service;

import iuh.fit.se.client.FoodServiceClient;
import iuh.fit.se.client.UserServiceClient;
import iuh.fit.se.dto.*;
import iuh.fit.se.entity.Order;
import iuh.fit.se.entity.OrderItem;
import iuh.fit.se.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final FoodServiceClient foodServiceClient;
    private final UserServiceClient userServiceClient;

    // Tạo đơn hàng mới
    public OrderResponse createOrder(OrderRequest request) {
        // 1. Validate user
        UserServiceClient.UserInfo user = userServiceClient.getUserById(
                request.getUserId(), request.getToken());

        // 2. Build order
        Order order = Order.builder()
                .userId(request.getUserId())
                .userName(user.getUsername())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        // 3. Build order items + tính tổng tiền
        List<OrderItem> items = new ArrayList<>();
        double total = 0;

        for (OrderItemRequest itemReq : request.getItems()) {
            // Gọi Food Service lấy thông tin món
            FoodServiceClient.FoodInfo food = foodServiceClient.getFoodById(itemReq.getFoodId());

            if (!food.getAvailable()) {
                throw new RuntimeException("Món " + food.getName() + " hiện không có sẵn!");
            }

            double subtotal = food.getPrice() * itemReq.getQuantity();
            total += subtotal;

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .foodId(food.getId())
                    .foodName(food.getName())
                    .foodPrice(food.getPrice())
                    .quantity(itemReq.getQuantity())
                    .subtotal(subtotal)
                    .build();
            items.add(item);
        }

        order.setItems(items);
        order.setTotalAmount(total);

        Order saved = orderRepository.save(order);
        System.out.println("✅ Đơn hàng #" + saved.getId() + " đã được tạo cho user: " + user.getUsername());

        return toResponse(saved);
    }

    // Lấy tất cả đơn hàng
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Lấy đơn theo ID
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        return toResponse(order);
    }

    // Lấy đơn theo user (userId là String/UUID)
    public List<OrderResponse> getOrdersByUser(String userId) {
        return orderRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Cập nhật trạng thái (Payment Service gọi vào)
    public OrderResponse updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        order.setStatus(status);
        return toResponse(orderRepository.save(order));
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .foodId(item.getFoodId())
                        .foodName(item.getFoodName())
                        .foodPrice(item.getFoodPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .userName(order.getUserName())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}