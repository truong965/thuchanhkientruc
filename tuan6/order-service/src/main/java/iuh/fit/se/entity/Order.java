package iuh.fit.se.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;          // ID người đặt (UUID dạng String)
    private String userName;        // Tên người đặt (lưu cache)
    private String status;          // PENDING / CONFIRMED / PAID / CANCELLED
    private Double totalAmount;     // Tổng tiền
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<OrderItem> items;
}