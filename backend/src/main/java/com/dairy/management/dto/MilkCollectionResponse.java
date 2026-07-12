package com.dairy.management.dto;

import com.dairy.management.entity.CollectionSession;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MilkCollectionResponse {
    private Long id;
    private LocalDate collectionDate;
    private CollectionSession session;
    private BigDecimal quantityLitres;
    private BigDecimal fatPercentage;
    private String notes;
    private LocalDateTime createdAt;
}
