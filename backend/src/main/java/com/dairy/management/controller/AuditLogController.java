package com.dairy.management.controller;

import com.dairy.management.dto.AuditLogResponse;
import com.dairy.management.dto.PagedAuditLogsResponse;
import com.dairy.management.entity.AuditLog;
import com.dairy.management.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<PagedAuditLogsResponse> getAuditLogs(
            @RequestParam(defaultValue = "0")            int    page,
            @RequestParam(defaultValue = "20")           int    size,
            @RequestParam(required = false)              String action,
            @RequestParam(required = false)              String performedBy,
            @RequestParam(required = false)              Long   targetUserId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        String  a  = (action      != null && !action.isBlank())      ? action.trim().toUpperCase() : null;
        String  pb = (performedBy != null && !performedBy.isBlank()) ? performedBy.trim()          : null;

        LocalDateTime fromDt = (from != null) ? from.atStartOfDay()               : null;
        LocalDateTime toDt   = (to   != null) ? to.atTime(23, 59, 59)             : null;

        Specification<AuditLog> spec = AuditLogRepository.buildSpec(a, pb, targetUserId, fromDt, toDt);
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> pg = auditLogRepository.findAll(spec, pr);

        return ResponseEntity.ok(PagedAuditLogsResponse.builder()
                .content(pg.getContent().stream().map(this::toResponse).toList())
                .page(pg.getNumber())
                .size(pg.getSize())
                .total(pg.getTotalElements())
                .totalPages(pg.getTotalPages())
                .hasNext(pg.hasNext())
                .hasPrevious(pg.hasPrevious())
                .build());
    }

    private AuditLogResponse toResponse(AuditLog a) {
        return AuditLogResponse.builder()
                .id(a.getId())
                .action(a.getAction())
                .targetUserId(a.getTargetUserId())
                .targetUserName(a.getTargetUserName())
                .targetUserEmail(a.getTargetUserEmail())
                .performedBy(a.getPerformedBy())
                .details(a.getDetails())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
