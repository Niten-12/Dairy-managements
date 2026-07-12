package com.dairy.management.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {
    private Long          id;
    private String        action;
    private Long          targetUserId;
    private String        targetUserName;
    private String        targetUserEmail;
    private String        performedBy;
    private String        details;
    private LocalDateTime createdAt;
}
