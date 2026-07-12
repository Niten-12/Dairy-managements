package com.dairy.management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "milk_collections")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MilkCollection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private User farmer;

    @Column(name = "collection_date", nullable = false)
    private LocalDate collectionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CollectionSession session;

    @Column(name = "quantity_litres", nullable = false, precision = 6, scale = 2)
    private BigDecimal quantityLitres;

    @Column(name = "fat_percentage", precision = 4, scale = 2)
    private BigDecimal fatPercentage;

    @Column(length = 300)
    private String notes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
