package iuh.fit.se.dto;

import lombok.Data;

@Data
public class FoodRequest {
    private String name;
    private String description;
    private Double price;
    private String category;
    private Boolean available;
    private String imageUrl;
}