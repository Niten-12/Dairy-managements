package com.dairy.management.controller;

import com.dairy.management.entity.AuditLog;
import com.dairy.management.entity.User;
import com.dairy.management.repository.AuditLogRepository;
import com.dairy.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserController unit tests")
class AdminUserControllerTest {

    @Mock UserRepository     userRepository;
    @Mock AuditLogRepository auditLogRepository;
    @Mock PasswordEncoder    passwordEncoder;
    @Mock Authentication     auth;

    @InjectMocks AdminUserController controller;

    private User farmer;
    private User customer;
    private User admin;

    @BeforeEach
    void setUp() {
        farmer = User.builder().id(1L).name("Raju").email("raju@farm.com")
                .role("FARMER").active(true).createdAt(LocalDateTime.now()).build();
        customer = User.builder().id(2L).name("Priya").email("priya@dairy.com")
                .role("CUSTOMER").active(true).createdAt(LocalDateTime.now()).build();
        admin = User.builder().id(99L).name("Admin").email("admin@dairy.com")
                .role("ADMIN").active(true).createdAt(LocalDateTime.now()).build();
    }

    // ── List / Search ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /users returns paged users when no filters given")
    void getAllUsers_noFilter_returnsPaged() {
        Page<User> page = new PageImpl<>(List.of(farmer, customer));
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> resp = controller.getAllUsers(null, null, null, 0, 10);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("GET /users with role filter delegates to repository via Specification")
    void getAllUsers_withRoleFilter_delegatesToRepo() {
        Page<User> page = new PageImpl<>(List.of(farmer));
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> resp = controller.getAllUsers(null, "farmer", null, 0, 10);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(userRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /users with search returns results via repository")
    void getAllUsers_withSearch_delegatesToRepo() {
        Page<User> page = new PageImpl<>(List.of(farmer));
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> resp = controller.getAllUsers("  raju  ", null, null, 0, 10);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(userRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    // ── Toggle Status ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("PATCH /{id}/toggle-status deactivates an active user")
    void toggleStatus_activeUser_becomesInactive() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(auth.getName()).thenReturn("admin@dairy.com");

        ResponseEntity<?> resp = controller.toggleStatus(1L, auth);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(userRepository).save(argThat(u -> !((User) u).isActive()));
        verify(auditLogRepository).save(argThat(log ->
                "USER_DEACTIVATED".equals(((AuditLog) log).getAction())));
    }

    @Test
    @DisplayName("PATCH /{id}/toggle-status on admin account throws 403")
    void toggleStatus_adminAccount_throws403() {
        when(userRepository.findById(99L)).thenReturn(Optional.of(admin));
        when(auth.getName()).thenReturn("admin@dairy.com");

        assertThatThrownBy(() -> controller.toggleStatus(99L, auth))
                .hasMessageContaining("Cannot deactivate admin accounts");
    }

    @Test
    @DisplayName("PATCH /{id}/toggle-status self-deactivation throws 403")
    void toggleStatus_selfDeactivation_throws403() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customer));
        when(auth.getName()).thenReturn("priya@dairy.com"); // same as customer email

        assertThatThrownBy(() -> controller.toggleStatus(2L, auth))
                .hasMessageContaining("Cannot deactivate your own account");
    }

    // ── Reset Password ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /{id}/reset-password encodes and saves new password")
    void resetPassword_encodesPassword() {
        var req = new com.dairy.management.dto.AdminResetPasswordRequest();
        req.setNewPassword("newPass123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(passwordEncoder.encode("newPass123")).thenReturn("$encoded$");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(auditLogRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(auth.getName()).thenReturn("admin@dairy.com");

        ResponseEntity<?> resp = controller.resetPassword(1L, req, auth);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(userRepository).save(argThat(u -> "$encoded$".equals(((User) u).getPassword())));
        verify(auditLogRepository).save(argThat(log ->
                "PASSWORD_RESET".equals(((AuditLog) log).getAction())));
    }

    // ── Delete ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE /{id} on admin account throws 403")
    void deleteUser_adminAccount_throws403() {
        when(userRepository.findById(99L)).thenReturn(Optional.of(admin));
        when(auth.getName()).thenReturn("admin@dairy.com");

        assertThatThrownBy(() -> controller.deleteUser(99L, auth))
                .hasMessageContaining("Cannot delete admin accounts");
    }

    @Test
    @DisplayName("DELETE /{id} self-deletion throws 403")
    void deleteUser_selfDeletion_throws403() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(customer));
        when(auth.getName()).thenReturn("priya@dairy.com");

        assertThatThrownBy(() -> controller.deleteUser(2L, auth))
                .hasMessageContaining("Cannot delete your own account");
    }

    @Test
    @DisplayName("DELETE /{id} valid deletion returns 204")
    void deleteUser_valid_returns204() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(farmer));
        when(auth.getName()).thenReturn("admin@dairy.com");

        ResponseEntity<Void> resp = controller.deleteUser(1L, auth);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(userRepository).delete(farmer);
    }
}
