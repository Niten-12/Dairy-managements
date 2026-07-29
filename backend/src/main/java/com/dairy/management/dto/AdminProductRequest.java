package com.dairy.management.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request body for admin product create/update. Field-level rules are enforced
 * here (Bean Validation); cross-field rules that these annotations cannot
 * express — such as originalPrice >= price and category existence — live in
 * ProductService. Frontend validation is UX only; this is the real gate.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminProductRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must be at most 255 characters")
    private String name;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 digits and 2 decimals")
    private BigDecimal price;

    @DecimalMin(value = "0.01", message = "Original price must be greater than zero")
    @Digits(integer = 8, fraction = 2, message = "Original price must have at most 8 digits and 2 decimals")
    private BigDecimal originalPrice;

    @NotBlank(message = "Unit is required")
    @Size(max = 255, message = "Unit must be at most 255 characters")
    private String unit;

    @Size(max = 255, message = "Emoji must be at most 255 characters")
    private String emoji;

    @Size(max = 255, message = "Tag must be at most 255 characters")
    private String tag;

    @Pattern(regexp = "^(success|warning|error|info)?$",
            message = "Tag style must be one of: success, warning, error, info")
    private String tagType;

    @Size(max = 200, message = "Background must be at most 200 characters")
    private String bgGradient;

    private Boolean available;

    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    private Boolean featured;

    @Min(value = 0, message = "Sort order cannot be negative")
    private Integer sortOrder;

    private Long categoryId;
}
