package com.dairy.management.controller;

import com.dairy.management.dto.AuthResponse;
import com.dairy.management.dto.LoginRequest;
import com.dairy.management.dto.OtpSendRequest;
import com.dairy.management.dto.OtpVerifyRequest;
import com.dairy.management.dto.RegisterRequest;
import com.dairy.management.dto.VerifyTwoFactorLoginRequest;
import com.dairy.management.service.AuthService;
import com.dairy.management.service.TwoFactorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TwoFactorService twoFactorService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<AuthResponse> verifyTwoFactor(
            @Valid @RequestBody VerifyTwoFactorLoginRequest request,
            HttpServletRequest httpRequest) {
        boolean rememberMe = Boolean.parseBoolean(httpRequest.getHeader("X-Remember-Me"));
        return ResponseEntity.ok(authService.verifyTwoFactorLogin(request, twoFactorService, rememberMe));
    }

    // ── OTP Login ────────────────────────────────────────────────────────────

    @PostMapping("/otp/send")
    public ResponseEntity<Map<String, Object>> sendOtp(@Valid @RequestBody OtpSendRequest request) {
        return ResponseEntity.ok(authService.sendOtp(request));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return ResponseEntity.ok(authService.verifyOtpLogin(request));
    }
}
