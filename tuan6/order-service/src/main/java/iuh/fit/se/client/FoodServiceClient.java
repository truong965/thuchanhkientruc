package iuh.fit.se.client;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class FoodServiceClient {

    private final RestTemplate restTemplate;

    @Value("${food.service.url}")
    private String foodServiceUrl;

    // Lấy thông tin món ăn từ Food Service
    public FoodInfo getFoodById(Long foodId) {
        String url = foodServiceUrl + "/foods/" + foodId;
        try {
            return restTemplate.getForObject(url, FoodInfo.class);
        } catch (Exception e) {
            throw new RuntimeException("Không thể kết nối Food Service. FoodId: " + foodId);
        }
    }

    // Inner class map response từ Food Service
    @Data
    public static class FoodInfo {
        private Long id;
        private String name;
        private Double price;
        private Boolean available;
        private String category;
    }
}