package com.dairy.management.repository;

import com.dairy.management.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);
    List<Category> findAllByOrderBySortOrderAsc();
    boolean existsByName(String name);
    boolean existsByNameIgnoreCase(String name);
}
