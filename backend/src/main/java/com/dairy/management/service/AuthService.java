package com.dairy.management.service;

import com.dairy.management.dto.AuthResponse;
import com.dairy.management.dto.LoginRequest;
import com.dairy.management.dto.OtpSendRequest;
import com.dairy.management.dto.OtpVerifyRequest;
import com.dairy.management.dto.RegisterRequest;
import com.dairy.management.entity.User;
import com.dairy.management.exception.ApiException;
import com.dairy.management.repository.UserRepository;
import com.dairy.management.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final OtpService otpService;
    private final SmsService smsService;

    private static final long REMEMBER_ME_EXPIRATION = 30L * 24 * 60 * 60 * 1000; // 30 days
    private static final long DEFAULT_EXPIRATION      = 86_400_000L;               // 1 day

    // ── Register ────────────────────────────────────────────────────────────

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email already registered", HttpStatus.CONFLICT);
        }

        String role = (request.getRole() != null && !request.getRole().isBlank())
                ? request.getRole().toUpperCase()
                : "CUSTOMER";

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    // ── Password Login (email / username / phone) ────────────────────────────

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();
        String type       = resolveIdentifierType(identifier, request.getIdentifierType());

        User user = switch (type) {
            case "EMAIL"    -> userRepository.findByEmail(identifier)
                    .orElseThrow(() -> new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED));
            case "USERNAME" -> userRepository.findByUsername(identifier)
                    .orElseThrow(() -> new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED));
            case "PHONE"    -> userRepository.findByPhone(identifier)
                    .orElseThrow(() -> new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED));
            default         -> throw new ApiException("Invalid identifier type", HttpStatus.BAD_REQUEST);
        };

        // Spring Security authenticates using email as principal
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new ApiException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        if (user.isTwoFactorEnabled()) {
            String tempToken = jwtUtil.generateTempToken(user.getEmail());
            return AuthResponse.builder()
                    .requiresTwoFactor(true)
                    .tempToken(tempToken)
                    .build();
        }

        long expiry = request.isRememberMe() ? REMEMBER_ME_EXPIRATION : DEFAULT_EXPIRATION;
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails, expiry);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .expiresIn(expiry)
                .rememberMe(request.isRememberMe())
                .build();
    }

    // ── OTP Login — Step 1: Send OTP ─────────────────────────────────────────

    public Map<String, Object> sendOtp(OtpSendRequest request) {
        String phone = request.getPhone();

        userRepository.findByPhone(phone)
                .orElseThrow(() -> new ApiException(
                        "No account found with this mobile number", HttpStatus.NOT_FOUND));

        String code = otpService.generateAndStore(phone);
        smsService.sendOtp(phone, code);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "OTP sent to +91" + phone);
        response.put("expiresIn", 300);
        return response;
    }

    // ── OTP Login — Step 2: Verify OTP ───────────────────────────────────────

    public AuthResponse verifyOtpLogin(OtpVerifyRequest request) {
        String phone = request.getPhone();

        if (!otpService.verify(phone, request.getCode())) {
            throw new ApiException("Invalid OTP. Please try again.", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        long expiry = request.isRememberMe() ? REMEMBER_ME_EXPIRATION : DEFAULT_EXPIRATION;
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails, expiry);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .expiresIn(expiry)
                .rememberMe(request.isRememberMe())
                .build();
    }

    // ── 2FA verify (existing) ────────────────────────────────────────────────

    public AuthResponse verifyTwoFactorLogin(
            com.dairy.management.dto.VerifyTwoFactorLoginRequest request,
            TwoFactorService twoFactorService,
            boolean rememberMe) {

        String token = request.getTempToken();

        if (!jwtUtil.isTempToken(token)) {
            throw new ApiException("Invalid or expired session. Please log in again.", HttpStatus.UNAUTHORIZED);
        }

        String email;
        try {
            email = jwtUtil.extractUsername(token);
        } catch (Exception e) {
            throw new ApiException("Invalid or expired session. Please log in again.", HttpStatus.UNAUTHORIZED);
        }

        if (!twoFactorService.verifyCode(twoFactorService.getSecret(email), request.getCode())) {
            throw new ApiException("Invalid authenticator code", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        long expiry = rememberMe ? REMEMBER_ME_EXPIRATION : DEFAULT_EXPIRATION;
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String fullToken = jwtUtil.generateToken(userDetails, expiry);

        return AuthResponse.builder()
                .token(fullToken)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .expiresIn(expiry)
                .rememberMe(rememberMe)
                .build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String resolveIdentifierType(String identifier, String provided) {
        if (provided != null && !provided.isBlank()) {
            return provided.toUpperCase();
        }
        if (identifier.contains("@")) return "EMAIL";
        if (identifier.matches("\\d{10}"))   return "PHONE";
        return "USERNAME";
    }
}
