package com.dairy.management.service;

import com.dairy.management.dto.AuthResponse;
import com.dairy.management.dto.OtpSendRequest;
import com.dairy.management.dto.OtpVerifyRequest;
import com.dairy.management.entity.User;
import com.dairy.management.exception.ApiException;
import com.dairy.management.repository.UserRepository;
import com.dairy.management.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService OTP flow — devOtp exposure and verification")
class AuthServiceOtpTest {

    private static final String PHONE = "9777326418";
    private static final String CODE  = "123456";

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtUtil jwtUtil;
    @Mock AuthenticationManager authenticationManager;
    @Mock UserDetailsService userDetailsService;
    @Mock OtpService otpService;
    @Mock SmsService smsService;
    @Mock UserDetails userDetails;

    @InjectMocks AuthService authService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .id(1L).name("Customer").email("c@dairy.com")
                .phone(PHONE).role("CUSTOMER").password("$hash$")
                .build();
        activeUser.setActive(true);
        // fail-closed default, exactly as in application.yml
        ReflectionTestUtils.setField(authService, "exposeDevOtp", false);
    }

    /* ── devOtp exposure ────────────────────────────────────────────────── */

    @Test
    @DisplayName("Default config: OTP send response never contains devOtp or the raw code")
    void sendOtp_defaultConfig_neverExposesOtp() {
        when(userRepository.findByPhone(PHONE)).thenReturn(Optional.of(activeUser));
        when(otpService.generateAndStore(PHONE)).thenReturn(CODE);
        // smsService.sendOtp succeeds (no exception)

        OtpSendRequest req = new OtpSendRequest();
        req.setPhone(PHONE);
        Map<String, Object> response = authService.sendOtp(req);

        assertThat(response).doesNotContainKey("devOtp");
        assertThat(response.toString()).doesNotContain(CODE);
        assertThat(response).containsEntry("smsSent", true);
    }

    @Test
    @DisplayName("Default config + SMS failure: fails closed with 503 and no OTP leak")
    void sendOtp_smsFailure_failsClosed() {
        when(userRepository.findByPhone(PHONE)).thenReturn(Optional.of(activeUser));
        when(otpService.generateAndStore(PHONE)).thenReturn(CODE);
        doThrow(new RuntimeException("SMS provider down")).when(smsService).sendOtp(anyString(), anyString());

        OtpSendRequest req = new OtpSendRequest();
        req.setPhone(PHONE);

        assertThatThrownBy(() -> authService.sendOtp(req))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(e.getMessage()).doesNotContain(CODE);
                });
    }

    @Test
    @DisplayName("Dev switch enabled: devOtp is included (development-only path)")
    void sendOtp_devSwitch_exposesOtp() {
        ReflectionTestUtils.setField(authService, "exposeDevOtp", true);
        when(userRepository.findByPhone(PHONE)).thenReturn(Optional.of(activeUser));
        when(otpService.generateAndStore(PHONE)).thenReturn(CODE);
        doThrow(new RuntimeException("no SMS provider")).when(smsService).sendOtp(anyString(), anyString());

        OtpSendRequest req = new OtpSendRequest();
        req.setPhone(PHONE);
        Map<String, Object> response = authService.sendOtp(req);

        assertThat(response).containsEntry("devOtp", CODE);
        assertThat(response).containsEntry("smsSent", false);
    }

    /* ── Account state guards ───────────────────────────────────────────── */

    @Test
    @DisplayName("Deactivated account cannot request an OTP")
    void sendOtp_inactiveUser_forbidden() {
        activeUser.setActive(false);
        when(userRepository.findByPhone(PHONE)).thenReturn(Optional.of(activeUser));

        OtpSendRequest req = new OtpSendRequest();
        req.setPhone(PHONE);

        assertThatThrownBy(() -> authService.sendOtp(req))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Unknown phone number is rejected with 404")
    void sendOtp_unknownPhone_notFound() {
        when(userRepository.findByPhone(PHONE)).thenReturn(Optional.empty());

        OtpSendRequest req = new OtpSendRequest();
        req.setPhone(PHONE);

        assertThatThrownBy(() -> authService.sendOtp(req))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    /* ── Verification ───────────────────────────────────────────────────── */

    @Test
    @DisplayName("Wrong OTP is rejected with 401")
    void verifyOtp_wrongCode_unauthorized() {
        when(otpService.verify(PHONE, "000000")).thenReturn(false);

        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setPhone(PHONE);
        req.setCode("000000");

        assertThatThrownBy(() -> authService.verifyOtpLogin(req))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Correct OTP issues a JWT for the right user")
    void verifyOtp_success_issuesToken() {
        when(otpService.verify(PHONE, CODE)).thenReturn(true);
        when(userRepository.findByPhone(PHONE)).thenReturn(Optional.of(activeUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userDetailsService.loadUserByUsername("c@dairy.com")).thenReturn(userDetails);
        when(jwtUtil.generateToken(any(UserDetails.class), anyLong())).thenReturn("jwt-token");

        OtpVerifyRequest req = new OtpVerifyRequest();
        req.setPhone(PHONE);
        req.setCode(CODE);

        AuthResponse response = authService.verifyOtpLogin(req);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getRole()).isEqualTo("CUSTOMER");
        verify(userRepository).save(argThatUserHasLastLogin());
    }

    private static User argThatUserHasLastLogin() {
        return org.mockito.ArgumentMatchers.argThat(u -> u.getLastLoginAt() != null);
    }
}
