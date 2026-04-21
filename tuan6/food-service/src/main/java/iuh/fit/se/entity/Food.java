package iuh.fit.se.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "foods")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;        // Tên món
    private String description; // Mô tả
    private Double price;       // Giá
    private String category;    // Loại (Cơm, Phở, Nước,...)
    private Boolean available;  // Còn bán không
    private String imageUrl;    // Ảnh (optional)
}
