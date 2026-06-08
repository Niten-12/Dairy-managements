package com.dairy.management.service;

import com.dairy.management.dto.TwoFactorSetupResponse;
import com.dairy.management.entity.User;
import com.dairy.management.exception.ApiException;
import com.dairy.management.repository.UserRepository;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class TwoFactorService {

    private static final String ISSUER = "DairyPro";

    private final UserRepository userRepository;
    private final SecretGenerator secretGenerator = new DefaultSecretGenerator(32);

    public TwoFactorSetupResponse generateSetup(String email) {
        User user = findUser(email);

        String secret = secretGenerator.generate();
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        String otpauthUrl = buildOtpauthUrl(email, secret);

        return TwoFactorSetupResponse.builder()
                .secret(secret)
                .otpauthUrl(otpauthUrl)
                .build();
    }

    public void enableTwoFactor(String email, String code) {
        User user = findUser(email);

        if (user.getTwoFactorSecret() == null) {
            throw new ApiException("Setup not initiated. Call /setup first.", HttpStatus.BAD_REQUEST);
        }
        if (!verifyCode(user.getTwoFactorSecret(), code)) {
            throw new ApiException("Invalid verification code", HttpStatus.UNAUTHORIZED);
        }

        user.setTwoFactorEnabled(true);
        userRepository.save(user);
    }

    public void disableTwoFactor(String email, String code) {
        User user = findUser(email);

        if (!user.isTwoFactorEnabled()) {
            throw new ApiException("Two-factor authentication is not enabled", HttpStatus.BAD_REQUEST);
        }
        if (!verifyCode(user.getTwoFactorSecret(), code)) {
            throw new ApiException("Invalid verification code", HttpStatus.UNAUTHORIZED);
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
    }

    public boolean verifyCode(String secret, String code) {
        try {
            TimeProvider timeProvider = new SystemTimeProvider();
            CodeGenerator codeGenerator = new DefaultCodeGenerator();
            CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
            return verifier.isValidCode(secret, code);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTwoFactorEnabled(String email) {
        return userRepository.findByEmail(email)
                .map(User::isTwoFactorEnabled)
                .orElse(false);
    }

    public String getSecret(String email) {
        return findUser(email).getTwoFactorSecret();
    }

    private String buildOtpauthUrl(String email, String secret) {
        String encodedIssuer  = URLEncoder.encode(ISSUER, StandardCharsets.UTF_8);
        String encodedAccount = URLEncoder.encode(email,  StandardCharsets.UTF_8);
        String encodedSecret  = URLEncoder.encode(secret, StandardCharsets.UTF_8);
        return "otpauth://totp/" + encodedIssuer + ":" + encodedAccount
                + "?secret=" + encodedSecret
                + "&issuer=" + encodedIssuer
                + "&algorithm=SHA1&digits=6&period=30";
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
    }
}
