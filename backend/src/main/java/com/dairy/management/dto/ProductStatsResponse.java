package com.dairy.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductStatsResponse {
    private long total;
    private long active;
    private long inactive;
    private long featured;
    private long lowStock;
    private long outOfStock;
    private long categories;
}
