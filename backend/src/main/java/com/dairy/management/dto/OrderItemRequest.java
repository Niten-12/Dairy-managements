package com.dairy.management.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItemRequest {
    @NotNull
    private Long productId;
    private String productName;
    private String productEmoji;
    private String productUnit;

    @NotNull
    @Min(1)
    private Integer quantity;
    private Double unitPrice;
}
