package com.dairy.management.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Security 401/403 JSON handlers")
class SecurityErrorHandlersTest {

    private ObjectMapper objectMapper;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        request = new MockHttpServletRequest("GET", "/api/admin/products");
        response = new MockHttpServletResponse();
    }

    @Test
    @DisplayName("Entry point writes structured 401 without internal details")
    void entryPointWrites401() throws Exception {
        new RestAuthenticationEntryPoint(objectMapper)
                .commence(request, response, new InsufficientAuthenticationException(
                        "Full authentication is required to access this resource"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).startsWith("application/json");

        JsonNode body = objectMapper.readTree(response.getContentAsString());
        assertThat(body.get("status").asInt()).isEqualTo(401);
        assertThat(body.get("error").asText()).isEqualTo("UNAUTHORIZED");
        assertThat(body.get("message").asText()).isEqualTo("Authentication is required");
        // no stack traces / exception class names leak
        assertThat(response.getContentAsString())
                .doesNotContain("Exception").doesNotContain("at com.");
    }

    @Test
    @DisplayName("Access denied handler writes structured 403 without internal details")
    void accessDeniedHandlerWrites403() throws Exception {
        new RestAccessDeniedHandler(objectMapper)
                .handle(request, response, new AccessDeniedException("Access Denied"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).startsWith("application/json");

        JsonNode body = objectMapper.readTree(response.getContentAsString());
        assertThat(body.get("status").asInt()).isEqualTo(403);
        assertThat(body.get("error").asText()).isEqualTo("FORBIDDEN");
        assertThat(body.get("message").asText())
                .isEqualTo("You do not have permission to access this resource");
        assertThat(response.getContentAsString())
                .doesNotContain("Exception").doesNotContain("at com.");
    }
}
