package com.dairy.management.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        try {
            authenticate(token, request);
        } catch (JwtException | IllegalArgumentException e) {
            // Expired, malformed, wrong-signature or empty token → proceed
            // unauthenticated; protected endpoints then receive a 401 from
            // RestAuthenticationEntryPoint. Log only the exception type —
            // never the token and never parser details that echo it.
            log.debug("Rejected bearer token: {}", e.getClass().getSimpleName());
        } catch (UsernameNotFoundException e) {
            // Token is valid but the account no longer exists → treat as
            // unauthenticated, not as a server error.
            log.debug("Rejected bearer token: subject no longer exists");
        }
        // Any other exception (DB down, programming error) intentionally
        // propagates so it keeps genuine 500 semantics and gets logged by
        // the container/advice instead of masquerading as an auth failure.

        filterChain.doFilter(request, response);
    }

    private void authenticate(String token, HttpServletRequest request) {
        final String username = jwtUtil.extractUsername(token);
        if (username == null || SecurityContextHolder.getContext().getAuthentication() != null) {
            return;
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!userDetails.isEnabled()) {
            // Deactivated accounts must lose access immediately, even if
            // their previously issued JWT is still within its lifetime.
            log.debug("Rejected bearer token: account disabled");
            return;
        }
        if (jwtUtil.isTokenValid(token, userDetails)) {
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
    }
}
