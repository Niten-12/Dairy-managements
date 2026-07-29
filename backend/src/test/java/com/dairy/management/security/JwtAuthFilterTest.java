package com.dairy.management.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthFilter — defensive token handling")
class JwtAuthFilterTest {

    private static final String SECRET =
            "test-jwt-secret-key-that-is-long-enough-for-hs256";
    private static final String EMAIL = "admin@dairy.com";

    @Mock UserDetailsServiceImpl userDetailsService;
    @Mock FilterChain filterChain;

    private JwtUtil jwtUtil;
    private JwtAuthFilter filter;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiration", 86_400_000L);
        filter = new JwtAuthFilter(jwtUtil, userDetailsService);
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private UserDetails enabledAdmin() {
        return new User(EMAIL, "pw", true, true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    private void runFilter() throws Exception {
        filter.doFilter(request, response, filterChain);
    }

    private Object currentAuth() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    /* ── Happy paths ────────────────────────────────────────────────────── */

    @Test
    @DisplayName("No Authorization header → chain continues unauthenticated")
    void noHeader_continuesUnauthenticated() throws Exception {
        runFilter();

        verify(filterChain).doFilter(request, response);
        assertThat(currentAuth()).isNull();
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("Valid token → authentication established with authorities")
    void validToken_authenticates() throws Exception {
        UserDetails admin = enabledAdmin();
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(admin);
        request.addHeader("Authorization", "Bearer " + jwtUtil.generateToken(admin));

        runFilter();

        verify(filterChain).doFilter(request, response);
        assertThat(currentAuth()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting("authority").containsExactly("ROLE_ADMIN");
    }

    /* ── Rejected tokens: unauthenticated, never a 500 ──────────────────── */

    @Test
    @DisplayName("Expired token → no exception, chain continues unauthenticated")
    void expiredToken_noAuthNoException() throws Exception {
        UserDetails admin = enabledAdmin();
        String expired = jwtUtil.generateToken(admin, -1_000L); // already expired
        request.addHeader("Authorization", "Bearer " + expired);

        runFilter();

        verify(filterChain).doFilter(request, response);
        assertThat(currentAuth()).isNull();
    }

    @Test
    @DisplayName("Malformed token → no exception, chain continues unauthenticated")
    void malformedToken_noAuthNoException() throws Exception {
        request.addHeader("Authorization", "Bearer not.a.valid-jwt");

        runFilter();

        verify(filterChain).doFilter(request, response);
        assertThat(currentAuth()).isNull();
    }

    @Test
    @DisplayName("Token signed with a different key → rejected, unauthenticated")
    void invalidSignature_noAuthNoException() throws Exception {
        JwtUtil foreign = new JwtUtil();
        ReflectionTestUtils.setField(foreign, "secret",
                "a-completely-different-secret-key-for-forged-tokens!");
        ReflectionTestUtils.setField(foreign, "expiration", 86_400_000L);
        request.addHeader("Authorization", "Bearer " + foreign.generateToken(enabledAdmin()));

        runFilter();

        verify(filterChain).doFilter(request, response);
        assertThat(currentAuth()).isNull();
    }

    @Test
    @DisplayName("Valid token for a deactivated account → rejected")
    void disabledUser_noAuth() throws Exception {
        UserDetails disabled = new User(EMAIL, "pw", false, true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(disabled);
        request.addHeader("Authorization", "Bearer " + jwtUtil.generateToken(enabledAdmin()));

        runFilter();

        verify(filterChain).doFilter(request, response);
        assertThat(currentAuth()).isNull();
    }

    @Test
    @DisplayName("Valid token whose user no longer exists → rejected, no 500")
    void unknownUser_noAuthNoException() throws Exception {
        when(userDetailsService.loadUserByUsername(EMAIL))
                .thenThrow(new UsernameNotFoundException("gone"));
        request.addHeader("Authorization", "Bearer " + jwtUtil.generateToken(enabledAdmin()));

        runFilter();

        verify(filterChain).doFilter(request, response);
        assertThat(currentAuth()).isNull();
    }

    /* ── Infrastructure failures keep 500 semantics ─────────────────────── */

    @Test
    @DisplayName("Unexpected infrastructure failure propagates (not misread as bad JWT)")
    void infrastructureFailure_propagates() {
        when(userDetailsService.loadUserByUsername(EMAIL))
                .thenThrow(new IllegalStateException("database down"));
        request.addHeader("Authorization", "Bearer " + jwtUtil.generateToken(enabledAdmin()));

        assertThatThrownBy(this::runFilter)
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("database down");
        assertThat(currentAuth()).isNull();
    }
}
