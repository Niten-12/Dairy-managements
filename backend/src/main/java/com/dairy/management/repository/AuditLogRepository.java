package com.dairy.management.repository;

import com.dairy.management.entity.AuditLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    List<AuditLog> findByTargetUserIdOrderByCreatedAtDesc(Long targetUserId);

    static Specification<AuditLog> buildSpec(String action, String performedBy,
                                              Long targetUserId,
                                              LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (performedBy != null && !performedBy.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("performedBy")),
                        "%" + performedBy.toLowerCase() + "%"));
            }
            if (targetUserId != null) {
                predicates.add(cb.equal(root.get("targetUserId"), targetUserId));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            return predicates.isEmpty()
                ? cb.conjunction()
                : cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
