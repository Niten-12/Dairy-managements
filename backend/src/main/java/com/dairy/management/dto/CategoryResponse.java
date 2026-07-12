package com.dairy.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private String emoji;
    private String description;
    private String bgColor;
    private String ringColor;
    private Integer sortOrder;
    private String imageUrl;
    private long productCount;
}
