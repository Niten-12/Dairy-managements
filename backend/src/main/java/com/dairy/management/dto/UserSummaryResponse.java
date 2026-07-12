package com.dairy.management.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserSummaryResponse {
    private Long          id;
    private String        name;
    private String        email;
    private String        role;
    private String        phone;
    private boolean       active;
    private boolean       twoFactorEnabled;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
