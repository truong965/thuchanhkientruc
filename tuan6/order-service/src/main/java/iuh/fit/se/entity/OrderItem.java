package iuh.fit.se.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    private Long foodId;
    private String foodName;   // Cache tên món
    private Double foodPrice;  // Cache giá lúc đặt
    private Integer quantity;
    private Double subtotal;   // foodPrice * quantity
}