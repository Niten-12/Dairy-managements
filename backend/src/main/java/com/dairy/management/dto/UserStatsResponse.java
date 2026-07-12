package com.dairy.management.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserStatsResponse {
    private long total;
    private long admins;
    private long farmers;
    private long deliveryBoys;
    private long customers;
    private long active;
    private long inactive;
}
