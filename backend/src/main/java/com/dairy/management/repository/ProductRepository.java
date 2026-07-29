package com.dairy.management.repository;

import com.dairy.management.entity.Product;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByAvailableTrue(Sort sort);
    List<Product> findByFeaturedTrueAndAvailableTrue(Sort sort);
    List<Product> findByCategoryIdAndAvailableTrue(Long categoryId, Sort sort);
    List<Product> findByNameContainingIgnoreCaseAndAvailableTrue(String name, Sort sort);
    Optional<Product> findByNameIgnoreCase(String name);
}
