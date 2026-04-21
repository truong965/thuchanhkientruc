package iuh.fit.se.repository;

import iuh.fit.se.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findByAvailableTrue();
    List<Food> findByCategory(String category);
}