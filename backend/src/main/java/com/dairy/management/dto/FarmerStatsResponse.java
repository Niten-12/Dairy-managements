package com.dairy.management.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FarmerStatsResponse {
    private BigDecimal todayLitres;
    private BigDecimal weekLitres;
    private BigDecimal monthLitres;
    private BigDecimal avgFatPercent;
    private long monthEntryCount;
}
