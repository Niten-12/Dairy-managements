package com.dairy.management.controller;

import com.dairy.management.dto.*;
import com.dairy.management.entity.AuditLog;
import com.dairy.management.entity.User;
import com.dairy.management.exception.ApiException;
import com.dairy.management.repository.AuditLogRepository;
import com.dairy.management.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private static final Set<String> CREATABLE_ROLES = Set.of("FARMER", "DELIVERY_BOY");
    private static final Set<String> EDITABLE_ROLES  = Set.of("FARMER", "DELIVERY_BOY", "CUSTOMER");
    private static final DateTimeFormatter CSV_DATE   = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final UserRepository     userRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder    passwordEncoder;

    // ── Stats ─────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<UserStatsResponse> getStats() {
        return ResponseEntity.ok(UserStatsResponse.builder()
                .total(userRepository.count())
                .admins(userRepository.countByRole("ADMIN"))
                .farmers(userRepository.countByRole("FARMER"))
                .deliveryBoys(userRepository.countByRole("DELIVERY_BOY"))
                .customers(userRepository.countByRole("CUSTOMER"))
                .active(userRepository.countByActive(true))
                .inactive(userRepository.countByActive(false))
                .build());
    }

    // ── CSV Export ────────────────────────────────────────────────────────────

    @GetMapping("/export")
    public void exportCsv(
            @RequestParam(required = false) String  search,
            @RequestParam(required = false) String  role,
            @RequestParam(required = false) Boolean active,
            HttpServletResponse response) throws IOException {

        String  s = (search != null && !search.isBlank()) ? search.trim() : null;
        String  r = (role   != null && !role.isBlank())   ? role.trim().toUpperCase() : null;
        List<User> users = userRepository.searchUsers(s, r, active);

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"users.csv\"");

        try (var out = response.getOutputStream()) {
            // UTF-8 BOM so Excel opens correctly
            out.write(new byte[]{(byte)0xEF, (byte)0xBB, (byte)0xBF});
            PrintWriter pw = new PrintWriter(new java.io.OutputStreamWriter(out, java.nio.charset.StandardCharsets.UTF_8));
            pw.println("Name,Email,Phone,Role,Status,2FA Enabled,Last Login,Created Date");
            for (User u : users) {
                pw.println(String.join(",",
                        csvSafe(u.getName()),
                        csvSafe(u.getEmail()),
                        csvSafe(u.getPhone()),
                        csvSafe(u.getRole()),
                        u.isActive() ? "Active" : "Inactive",
                        u.isTwoFactorEnabled() ? "Yes" : "No",
                        u.getLastLoginAt() != null ? u.getLastLoginAt().format(CSV_DATE) : "Never",
                        u.getCreatedAt()   != null ? u.getCreatedAt().format(CSV_DATE)   : ""
                ));
            }
            pw.flush();
        }
    }

    // ── List / Search (paginated) ─────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<PagedUsersResponse> getAllUsers(
            @RequestParam(required = false)              String  search,
            @RequestParam(required = false)              String  role,
            @RequestParam(required = false)              Boolean active,
            @RequestParam(defaultValue = "0")            int     page,
            @RequestParam(defaultValue = "10")           int     size) {

        String  s = (search != null && !search.isBlank()) ? search.trim() : null;
        String  r = (role   != null && !role.isBlank())   ? role.trim().toUpperCase() : null;

        Specification<User> spec = UserRepository.buildSpec(s, r, active);
        PageRequest pr = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User>  pg = userRepository.findAll(spec, pr);

        List<UserSummaryResponse> content = pg.getContent().stream().map(this::toSummary).toList();

        return ResponseEntity.ok(PagedUsersResponse.builder()
                .content(content)
                .page(pg.getNumber())
                .size(pg.getSize())
                .total(pg.getTotalElements())
                .totalPages(pg.getTotalPages())
                .hasNext(pg.hasNext())
                .hasPrevious(pg.hasPrevious())
                .build());
    }

    // ── Create ─────────────────────────────────────────────────────────────────

    @SuppressWarnings("null")
    @PostMapping
    public ResponseEntity<UserSummaryResponse> createUser(
            @Valid @RequestBody AdminCreateUserRequest req,
            Authentication auth) {

        String role = req.getRole().toUpperCase();
        if (!CREATABLE_ROLES.contains(role)) {
            throw new ApiException("Role must be FARMER or DELIVERY_BOY", HttpStatus.BAD_REQUEST);
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ApiException("Email already registered", HttpStatus.CONFLICT);
        }

        String phone = (req.getPhone() == null || req.getPhone().isBlank())
                ? null : req.getPhone().trim();
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new ApiException("Mobile number already registered", HttpStatus.CONFLICT);
        }

        User user = User.builder()
                .name(req.getName().trim())
                .email(req.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(phone).role(role).active(true)
                .build();

        User saved = userRepository.save(user);

        auditLogRepository.save(AuditLog.builder()
                .action("USER_CREATED")
                .targetUserId(saved.getId())
                .targetUserName(saved.getName())
                .targetUserEmail(saved.getEmail())
                .performedBy(auth.getName())
                .details("Role: " + saved.getRole())
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(toSummary(saved));
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    @SuppressWarnings("null")
    @PutMapping("/{id}")
    public ResponseEntity<UserSummaryResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest req,
            Authentication auth) {

        User user = findOrThrow(id);
        String newRole = req.getRole().toUpperCase();

        if ("ADMIN".equals(user.getRole()) && !newRole.equals("ADMIN")) {
            throw new ApiException("Cannot change the role of an admin account", HttpStatus.FORBIDDEN);
        }
        if (!"ADMIN".equals(user.getRole()) && !EDITABLE_ROLES.contains(newRole)) {
            throw new ApiException("Invalid role. Allowed: FARMER, DELIVERY_BOY, CUSTOMER", HttpStatus.BAD_REQUEST);
        }

        String newEmail = (req.getEmail() == null || req.getEmail().isBlank())
                ? null : req.getEmail().trim().toLowerCase();
        String newPhone = (req.getPhone() == null || req.getPhone().isBlank())
                ? null : req.getPhone().trim();

        if (newEmail != null && !newEmail.equals(user.getEmail())
                && userRepository.existsByEmailAndIdNot(newEmail, id)) {
            throw new ApiException("Email is already used by another account", HttpStatus.CONFLICT);
        }
        if (newPhone != null && !newPhone.equals(user.getPhone())
                && userRepository.existsByPhoneAndIdNot(newPhone, id)) {
            throw new ApiException("Mobile number is already used by another account", HttpStatus.CONFLICT);
        }

        List<String> changes = new ArrayList<>();
        if (!req.getName().trim().equals(user.getName()))  changes.add("name");
        if (!Objects.equals(newEmail, user.getEmail()))    changes.add("email");
        if (!Objects.equals(newPhone, user.getPhone()))    changes.add("phone");
        if (!newRole.equals(user.getRole()) && !"ADMIN".equals(user.getRole())) changes.add("role→" + newRole);

        user.setName(req.getName().trim());
        user.setEmail(newEmail);
        user.setPhone(newPhone);
        if (!"ADMIN".equals(user.getRole())) user.setRole(newRole);

        User saved = userRepository.save(user);

        if (!changes.isEmpty()) {
            auditLogRepository.save(AuditLog.builder()
                    .action("USER_UPDATED")
                    .targetUserId(saved.getId())
                    .targetUserName(saved.getName())
                    .targetUserEmail(saved.getEmail())
                    .performedBy(auth.getName())
                    .details("Changed: " + String.join(", ", changes))
                    .build());
        }

        return ResponseEntity.ok(toSummary(saved));
    }

    // ── Toggle Active / Inactive ────────────────────────────────────────────────

    @SuppressWarnings("null")
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<UserSummaryResponse> toggleStatus(
            @PathVariable Long id, Authentication auth) {

        User user = findOrThrow(id);
        if ("ADMIN".equals(user.getRole())) {
            throw new ApiException("Cannot deactivate admin accounts", HttpStatus.FORBIDDEN);
        }

        String principal = auth.getName();
        if (principal.equals(user.getEmail()) || principal.equals(user.getPhone())) {
            throw new ApiException("Cannot deactivate your own account", HttpStatus.FORBIDDEN);
        }

        user.setActive(!user.isActive());
        User saved = userRepository.save(user);

        auditLogRepository.save(AuditLog.builder()
                .action(saved.isActive() ? "USER_ACTIVATED" : "USER_DEACTIVATED")
                .targetUserId(saved.getId())
                .targetUserName(saved.getName())
                .targetUserEmail(saved.getEmail())
                .performedBy(principal)
                .details(saved.isActive() ? "Account activated" : "Account deactivated")
                .build());

        return ResponseEntity.ok(toSummary(saved));
    }

    // ── Reset Password ──────────────────────────────────────────────────────────

    @SuppressWarnings("null")
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody AdminResetPasswordRequest req,
            Authentication auth) {

        User user = findOrThrow(id);
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        auditLogRepository.save(AuditLog.builder()
                .action("PASSWORD_RESET")
                .targetUserId(user.getId())
                .targetUserName(user.getName())
                .targetUserEmail(user.getEmail())
                .performedBy(auth.getName())
                .details("Password reset by admin")
                .build());

        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    // ── Bulk Delete ─────────────────────────────────────────────────────────────

    @SuppressWarnings("null")
    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String, Object>> bulkDelete(
            @Valid @RequestBody BulkUserIdsRequest req,
            Authentication auth) {

        String principal = auth.getName();
        List<String> skipped = new ArrayList<>();
        int deleted = 0;

        for (Long id : req.getIds()) {
            Optional<User> opt = userRepository.findById(id);
            if (opt.isEmpty()) { skipped.add("id:" + id + " (not found)"); continue; }
            User u = opt.get();
            if ("ADMIN".equals(u.getRole()))                                   { skipped.add(u.getName() + " (admin)"); continue; }
            if (principal.equals(u.getEmail()) || principal.equals(u.getPhone())) { skipped.add(u.getName() + " (self)"); continue; }

            userRepository.delete(u);
            auditLogRepository.save(AuditLog.builder()
                    .action("USER_DELETED")
                    .targetUserId(u.getId())
                    .targetUserName(u.getName())
                    .targetUserEmail(u.getEmail())
                    .performedBy(principal)
                    .details("Bulk delete")
                    .build());
            deleted++;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("deleted", deleted);
        result.put("skipped", skipped.size());
        if (!skipped.isEmpty()) result.put("skippedUsers", skipped);
        return ResponseEntity.ok(result);
    }

    // ── Bulk Status Change ──────────────────────────────────────────────────────

    @SuppressWarnings("null")
    @PostMapping("/bulk-status")
    public ResponseEntity<Map<String, Object>> bulkStatus(
            @Valid @RequestBody BulkStatusRequest req,
            Authentication auth) {

        String principal = auth.getName();
        boolean targetActive = req.getActive();
        List<String> skipped = new ArrayList<>();
        int updated = 0;

        for (Long id : req.getIds()) {
            Optional<User> opt = userRepository.findById(id);
            if (opt.isEmpty()) { skipped.add("id:" + id + " (not found)"); continue; }
            User u = opt.get();
            if ("ADMIN".equals(u.getRole()))                                      { skipped.add(u.getName() + " (admin)"); continue; }
            if (principal.equals(u.getEmail()) || principal.equals(u.getPhone())) { skipped.add(u.getName() + " (self)"); continue; }
            if (u.isActive() == targetActive)                                      { continue; } // no change needed

            u.setActive(targetActive);
            userRepository.save(u);
            auditLogRepository.save(AuditLog.builder()
                    .action(targetActive ? "USER_ACTIVATED" : "USER_DEACTIVATED")
                    .targetUserId(u.getId())
                    .targetUserName(u.getName())
                    .targetUserEmail(u.getEmail())
                    .performedBy(principal)
                    .details("Bulk " + (targetActive ? "activation" : "deactivation"))
                    .build());
            updated++;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("updated", updated);
        result.put("skipped", skipped.size());
        if (!skipped.isEmpty()) result.put("skippedUsers", skipped);
        return ResponseEntity.ok(result);
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    @SuppressWarnings("null")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication auth) {
        User target = findOrThrow(id);

        if ("ADMIN".equals(target.getRole())) {
            throw new ApiException("Cannot delete admin accounts", HttpStatus.FORBIDDEN);
        }
        String principal = auth.getName();
        if (principal.equals(target.getEmail()) || principal.equals(target.getPhone())) {
            throw new ApiException("Cannot delete your own account", HttpStatus.FORBIDDEN);
        }

        auditLogRepository.save(AuditLog.builder()
                .action("USER_DELETED")
                .targetUserId(target.getId())
                .targetUserName(target.getName())
                .targetUserEmail(target.getEmail())
                .performedBy(principal)
                .details("Single delete")
                .build());

        userRepository.delete(target);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
    }

    @SuppressWarnings("null")
    private UserSummaryResponse toSummary(User u) {
        return UserSummaryResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole())
                .phone(u.getPhone())
                .active(u.isActive())
                .twoFactorEnabled(u.isTwoFactorEnabled())
                .lastLoginAt(u.getLastLoginAt())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private static String csvSafe(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
