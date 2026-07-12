package com.dairy.management.repository;

import com.dairy.management.entity.MilkCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MilkCollectionRepository extends JpaRepository<MilkCollection, Long> {

    List<MilkCollection> findByFarmerIdOrderByCollectionDateDescCreatedAtDesc(Long farmerId);

    @Query("SELECT COALESCE(SUM(m.quantityLitres), 0) FROM MilkCollection m WHERE m.farmer.id = :farmerId AND m.collectionDate = :date")
    BigDecimal sumByFarmerAndDate(@Param("farmerId") Long farmerId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(m.quantityLitres), 0) FROM MilkCollection m WHERE m.farmer.id = :farmerId AND m.collectionDate >= :from")
    BigDecimal sumByFarmerSince(@Param("farmerId") Long farmerId, @Param("from") LocalDate from);

    @Query("SELECT COALESCE(AVG(m.fatPercentage), 0) FROM MilkCollection m WHERE m.farmer.id = :farmerId AND m.fatPercentage IS NOT NULL AND m.collectionDate >= :from")
    BigDecimal avgFatByFarmerSince(@Param("farmerId") Long farmerId, @Param("from") LocalDate from);

    @Query("SELECT COUNT(m) FROM MilkCollection m WHERE m.farmer.id = :farmerId AND m.collectionDate >= :from")
    long countByFarmerSince(@Param("farmerId") Long farmerId, @Param("from") LocalDate from);
}
