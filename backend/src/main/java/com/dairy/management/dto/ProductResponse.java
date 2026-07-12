package com.dairy.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String unit;
    private String emoji;
    private String tag;
    private String tagType;
    private String bgGradient;
    private boolean available;
    private Integer stock;
    private boolean featured;
    private Integer sortOrder;
    private BigDecimal originalPrice;
    private String imageUrl;
    private Long categoryId;
    private String categoryName;
    private String categoryEmoji;
    private LocalDateTime createdAt;
}
