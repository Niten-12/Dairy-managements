package com.dairy.management.repository;

import com.dairy.management.entity.User;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByPhone(String phone);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByPhone(String phone);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByPhoneAndIdNot(String phone, Long id);

    long countByRole(String role);
    long countByActive(boolean active);

    static Specification<User> buildSpec(String search, String role, Boolean active) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(cb.coalesce(root.get("email"), "")), like),
                    cb.like(cb.coalesce(root.get("phone"), ""), "%" + search + "%")
                ));
            }
            if (role != null && !role.isBlank()) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return predicates.isEmpty()
                ? cb.conjunction()
                : cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    default List<User> searchUsers(String search, String role, Boolean active) {
        return findAll(buildSpec(search, role, active),
                Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
