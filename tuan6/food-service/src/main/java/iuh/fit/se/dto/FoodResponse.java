package iuh.fit.se.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FoodResponse {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private String category;
    private Boolean available;
    private String imageUrl;
}
