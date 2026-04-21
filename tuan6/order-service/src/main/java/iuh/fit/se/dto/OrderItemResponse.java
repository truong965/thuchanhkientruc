package iuh.fit.se.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderItemResponse {
    private Long foodId;
    private String foodName;
    private Double foodPrice;
    private Integer quantity;
    private Double subtotal;
}
