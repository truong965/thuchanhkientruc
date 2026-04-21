package iuh.fit.se;

import iuh.fit.se.entity.Food;
import iuh.fit.se.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final FoodRepository foodRepository;

    @Override
    public void run(String... args) {
        if (foodRepository.count() == 0) {
            foodRepository.saveAll(List.of(
                    Food.builder().name("Cơm tấm sườn").description("Cơm tấm sườn nướng đặc biệt")
                            .price(45000.0).category("Cơm").available(true).build(),

                    Food.builder().name("Phở bò tái").description("Phở bò tái chín nước trong")
                            .price(55000.0).category("Phở").available(true).build(),

                    Food.builder().name("Bún bò Huế").description("Bún bò cay đặc trưng Huế")
                            .price(50000.0).category("Bún").available(true).build(),

                    Food.builder().name("Bánh mì thịt").description("Bánh mì kẹp thịt nguội pate")
                            .price(25000.0).category("Bánh mì").available(true).build(),

                    Food.builder().name("Nước cam ép").description("Cam tươi ép nguyên chất")
                            .price(20000.0).category("Nước").available(true).build(),

                    Food.builder().name("Trà sữa trân châu").description("Trà sữa trân châu đen")
                            .price(35000.0).category("Nước").available(false).build()
            ));
            System.out.println("Seeded 6 sample foods!");
        }
    }
}