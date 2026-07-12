package com.dairy.management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String action; // PASSWORD_RESET | USER_ACTIVATED | USER_DEACTIVATED

    @Column(nullable = false)
    private Long targetUserId;

    private String targetUserName;
    private String targetUserEmail;

    @Column(nullable = false)
    private String performedBy; // admin principal

    private String details;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
