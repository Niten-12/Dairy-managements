package com.dairy.management.service;

import com.dairy.management.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    private record OtpEntry(String code, Instant expiresAt, int verifyAttempts) {}
    private record RateEntry(int count, Instant windowStart) {}

    private final ConcurrentHashMap<String, OtpEntry> otpStore    = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RateEntry> rateLimits = new ConcurrentHashMap<>();
    private final Random random = new Random();

    private static final int OTP_EXPIRY_SECONDS  = 300; // 5 minutes
    private static final int MAX_SEND_PER_HOUR   = 5;
    private static final int MAX_VERIFY_ATTEMPTS = 3;

    /**
     * Generates a 6-digit OTP, stores it, enforces rate limit.
     * Returns the code so the caller can forward it (via SMS or dev log).
     */
    public String generateAndStore(String phone) {
        checkRateLimit(phone);

        String code = String.format("%06d", random.nextInt(1_000_000));
        otpStore.put(phone, new OtpEntry(code, Instant.now().plusSeconds(OTP_EXPIRY_SECONDS), 0));

        // DEV: log OTP to console — replace with real SMS provider in production
        log.info("[OTP-DEV] Phone: {} → Code: {}", phone, code);
        return code;
    }

    /**
     * Verifies the OTP for a given phone. Returns true on success, false on mismatch.
     * Throws ApiException when OTP is expired or max attempts exceeded.
     */
    public boolean verify(String phone, String code) {
        OtpEntry entry = otpStore.get(phone);

        if (entry == null) {
            throw new ApiException("OTP not found or already used. Request a new one.", HttpStatus.UNAUTHORIZED);
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            otpStore.remove(phone);
            throw new ApiException("OTP has expired. Please request a new one.", HttpStatus.UNAUTHORIZED);
        }
        if (entry.verifyAttempts() >= MAX_VERIFY_ATTEMPTS) {
            otpStore.remove(phone);
            throw new ApiException("Too many incorrect attempts. Please request a new OTP.", HttpStatus.TOO_MANY_REQUESTS);
        }
        if (!entry.code().equals(code)) {
            otpStore.put(phone, new OtpEntry(entry.code(), entry.expiresAt(), entry.verifyAttempts() + 1));
            return false;
        }

        otpStore.remove(phone);
        return true;
    }

    /** Seconds remaining until the pending OTP expires (0 if none). */
    public long getRemainingSeconds(String phone) {
        OtpEntry entry = otpStore.get(phone);
        if (entry == null) return 0;
        long remaining = Instant.now().until(entry.expiresAt(), ChronoUnit.SECONDS);
        return Math.max(0, remaining);
    }

    public boolean hasPendingOtp(String phone) {
        OtpEntry entry = otpStore.get(phone);
        return entry != null && Instant.now().isBefore(entry.expiresAt());
    }

    private void checkRateLimit(String phone) {
        RateEntry re = rateLimits.get(phone);
        Instant now  = Instant.now();

        if (re != null && now.isBefore(re.windowStart().plusSeconds(3600))) {
            if (re.count() >= MAX_SEND_PER_HOUR) {
                throw new ApiException(
                        "Too many OTP requests. Please wait before trying again.",
                        HttpStatus.TOO_MANY_REQUESTS);
            }
            rateLimits.put(phone, new RateEntry(re.count() + 1, re.windowStart()));
        } else {
            rateLimits.put(phone, new RateEntry(1, now));
        }
    }
}
