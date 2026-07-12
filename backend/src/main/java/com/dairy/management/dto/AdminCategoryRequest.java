package com.dairy.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminCategoryRequest {

    @NotBlank(message = "Category name is required")
    private String name;

    private String emoji;

    private String description;

    private String bgColor;

    private String ringColor;

    private Integer sortOrder;
}
