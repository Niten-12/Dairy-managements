package com.dairy.management.dto;

import com.dairy.management.entity.CollectionSession;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MilkCollectionRequest {

    @NotNull
    private LocalDate collectionDate;

    @NotNull
    private CollectionSession session;

    @NotNull
    @DecimalMin(value = "0.1", message = "Quantity must be at least 0.1 litres")
    private BigDecimal quantityLitres;

    private BigDecimal fatPercentage;

    private String notes;
}
