package iuh.fit.se.service;

import iuh.fit.se.dto.FoodRequest;
import iuh.fit.se.dto.FoodResponse;
import iuh.fit.se.entity.Food;
import iuh.fit.se.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodRepository foodRepository;

    // Lấy tất cả món ăn
    public List<FoodResponse> getAllFoods() {
        return foodRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Lấy món ăn đang bán
    public List<FoodResponse> getAvailableFoods() {
        return foodRepository.findByAvailableTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Lấy món theo ID (dùng cho Order Service gọi sang)
    public FoodResponse getFoodById(Long id) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food not found with id: " + id));
        return toResponse(food);
    }

    // Thêm món mới
    public FoodResponse createFood(FoodRequest request) {
        Food food = Food.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .available(request.getAvailable() != null ? request.getAvailable() : true)
                .imageUrl(request.getImageUrl())
                .build();
        return toResponse(foodRepository.save(food));
    }

    // Sửa món
    public FoodResponse updateFood(Long id, FoodRequest request) {
        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food not found with id: " + id));

        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setPrice(request.getPrice());
        food.setCategory(request.getCategory());
        if (request.getAvailable() != null) food.setAvailable(request.getAvailable());
        if (request.getImageUrl() != null) food.setImageUrl(request.getImageUrl());

        return toResponse(foodRepository.save(food));
    }

    // Xóa món
    public void deleteFood(Long id) {
        if (!foodRepository.existsById(id)) {
            throw new RuntimeException("Food not found with id: " + id);
        }
        foodRepository.deleteById(id);
    }

    // Convert Entity → DTO
    private FoodResponse toResponse(Food food) {
        return FoodResponse.builder()
                .id(food.getId())
                .name(food.getName())
                .description(food.getDescription())
                .price(food.getPrice())
                .category(food.getCategory())
                .available(food.getAvailable())
                .imageUrl(food.getImageUrl())
                .build();
    }
}
