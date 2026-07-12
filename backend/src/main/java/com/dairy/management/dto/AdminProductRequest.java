package com.dairy.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminProductRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    private BigDecimal price;

    @NotBlank
    private String unit;

    private String emoji;
    private String tag;
    private String tagType;
    private String bgGradient;
    private Boolean available;
    private Integer stock;
    private Boolean featured;
    private Integer sortOrder;
    private BigDecimal originalPrice;
    private Long categoryId;
}
