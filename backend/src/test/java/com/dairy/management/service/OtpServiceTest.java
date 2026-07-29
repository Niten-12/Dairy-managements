package com.dairy.management.service;

import com.dairy.management.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("OtpService security behavior")
class OtpServiceTest {

    private static final String PHONE = "9999988888";

    private Clock clock;
    private Instant now;
    private OtpService otpService;

    @BeforeEach
    void setUp() {
        now = Instant.parse("2026-07-13T10:00:00Z");
        clock = mock(Clock.class);
        when(clock.instant()).thenAnswer(inv -> now);
        when(clock.getZone()).thenReturn(ZoneOffset.UTC);
        otpService = new OtpService(clock);
    }

    private void advanceSeconds(long seconds) {
        now = now.plusSeconds(seconds);
    }

    @Test
    @DisplayName("OTP is single-use: second verify of the same code is rejected")
    void otpIsSingleUse() {
        String code = otpService.generateAndStore(PHONE);

        assertThat(otpService.verify(PHONE, code)).isTrue();

        assertThatThrownBy(() -> otpService.verify(PHONE, code))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("not found or already used")
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Expired OTP is rejected even with the correct code")
    void expiredOtpRejected() {
        String code = otpService.generateAndStore(PHONE);

        advanceSeconds(301); // expiry is 300s

        assertThatThrownBy(() -> otpService.verify(PHONE, code))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("expired")
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("After 3 wrong attempts even the correct code is rejected")
    void maxVerifyAttemptsEnforced() {
        String code = otpService.generateAndStore(PHONE);

        for (int i = 0; i < 3; i++) {
            assertThat(otpService.verify(PHONE, "000000")).isFalse();
        }

        assertThatThrownBy(() -> otpService.verify(PHONE, code))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Too many incorrect attempts")
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);

        // and the OTP is invalidated entirely, forcing a fresh send
        assertThatThrownBy(() -> otpService.verify(PHONE, code))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("not found or already used");
    }

    @Test
    @DisplayName("Send rate limit: 6th request within the hour is rejected")
    void sendRateLimitEnforced() {
        for (int i = 0; i < 5; i++) {
            otpService.generateAndStore(PHONE);
        }

        assertThatThrownBy(() -> otpService.generateAndStore(PHONE))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Too many OTP requests")
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    @DisplayName("Send rate limit window resets after an hour")
    void sendRateLimitWindowResets() {
        for (int i = 0; i < 5; i++) {
            otpService.generateAndStore(PHONE);
        }
        advanceSeconds(3601);

        String code = otpService.generateAndStore(PHONE);
        assertThat(code).matches("\\d{6}");
    }

    @Test
    @DisplayName("Remaining seconds reflects clock and drops to 0 after expiry")
    void remainingSecondsTracksClock() {
        otpService.generateAndStore(PHONE);
        assertThat(otpService.getRemainingSeconds(PHONE)).isEqualTo(300);

        advanceSeconds(120);
        assertThat(otpService.getRemainingSeconds(PHONE)).isEqualTo(180);

        advanceSeconds(200);
        assertThat(otpService.getRemainingSeconds(PHONE)).isZero();
        assertThat(otpService.hasPendingOtp(PHONE)).isFalse();
    }
}
