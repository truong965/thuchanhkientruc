package iuh.fit.se.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private String userId;    // đổi từ Long → String (UUID)
    private String token;     // token từ frontend gửi lên
    private List<OrderItemRequest> items;
}