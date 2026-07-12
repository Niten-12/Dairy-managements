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

import java.time.LocalDateTime;
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

        String role = "CUSTOMER"; // public registration always creates CUSTOMER accounts

        String phone = (request.getPhone() == null || request.getPhone().isBlank())
                ? null : request.getPhone().trim();
        String email = (request.getEmail() == null || request.getEmail().isBlank())
                ? null : request.getEmail().trim().toLowerCase();

        if (email != null && userRepository.existsByEmail(email)) {
            throw new ApiException("Email already registered", HttpStatus.CONFLICT);
        }
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new ApiException("Mobile number already registered", HttpStatus.CONFLICT);
        }

        User user = User.builder()
                .name(request.getName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(phone)
                .role(role)
                .build();

        userRepository.save(user);

        // Use phone as principal when no email provided
        String principal = email != null ? email : phone;
        UserDetails userDetails = userDetailsService.loadUserByUsername(principal);
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

        if (!user.isActive()) {
            throw new ApiException("Your account has been deactivated. Please contact the admin.", HttpStatus.FORBIDDEN);
        }

        // Use email if present, else phone as Spring Security principal
        String principal = user.getEmail() != null ? user.getEmail() : user.getPhone();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(principal, request.getPassword())
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

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        long expiry = request.isRememberMe() ? REMEMBER_ME_EXPIRATION : DEFAULT_EXPIRATION;
        UserDetails userDetails = userDetailsService.loadUserByUsername(principal);
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

        User otpUser = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ApiException(
                        "No account found with this mobile number", HttpStatus.NOT_FOUND));

        if (!otpUser.isActive()) {
            throw new ApiException("Your account has been deactivated. Please contact the admin.", HttpStatus.FORBIDDEN);
        }

        String code = otpService.generateAndStore(phone);

        boolean smsSent = false;
        try {
            smsService.sendOtp(phone, code);
            smsSent = true;
        } catch (Exception e) {
            smsSent = false;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("expiresIn", 300);
        response.put("smsSent", smsSent);
        response.put("message", smsSent ? "OTP sent to your mobile number" : "OTP ready — check screen");
        response.put("devOtp", code);
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

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String otpPrincipal = user.getEmail() != null ? user.getEmail() : user.getPhone();
        long expiry = request.isRememberMe() ? REMEMBER_ME_EXPIRATION : DEFAULT_EXPIRATION;
        UserDetails userDetails = userDetailsService.loadUserByUsername(otpPrincipal);
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

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

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
