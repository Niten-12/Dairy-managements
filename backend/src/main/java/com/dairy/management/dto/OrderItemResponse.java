package com.dairy.management.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productEmoji;
    private String productUnit;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
