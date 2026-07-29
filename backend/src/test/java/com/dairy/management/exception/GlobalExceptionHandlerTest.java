package com.dairy.management.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("GlobalExceptionHandler — structured, safe error responses")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("ApiException keeps its status and message (frontend contract)")
    void apiExceptionMapped() {
        ResponseEntity<ApiErrorResponse> resp =
                handler.handleApiException(new ApiException("Product not found", HttpStatus.NOT_FOUND));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(resp.getBody().getMessage()).isEqualTo("Product not found");
        assertThat(resp.getBody().getStatus()).isEqualTo(404);
        assertThat(resp.getBody().getError()).isEqualTo("NOT_FOUND");
    }

    @Test
    @DisplayName("Validation failure → 400 with field errors AND a usable message")
    void validationMapped() {
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(new Object(), "request");
        binding.addError(new FieldError("request", "price", "Price is required"));
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(binding);

        ResponseEntity<ApiErrorResponse> resp = handler.handleValidation(ex);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getBody().getError()).isEqualTo("VALIDATION_FAILED");
        assertThat(resp.getBody().getErrors()).containsEntry("price", "Price is required");
        assertThat(resp.getBody().getMessage()).isEqualTo("Price is required");
    }

    @Test
    @DisplayName("Path variable type mismatch → 400, not 500")
    void typeMismatchMapped() {
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                "abc", Long.class, "id", null, new NumberFormatException("For input string: \"abc\""));

        ResponseEntity<ApiErrorResponse> resp = handler.handleTypeMismatch(ex);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(resp.getBody().getMessage()).isEqualTo("Invalid value for parameter 'id'");
    }

    @Test
    @DisplayName("Unknown resource → 404, not 500")
    void noResourceMapped() throws Exception {
        NoResourceFoundException ex = mock(NoResourceFoundException.class);

        ResponseEntity<ApiErrorResponse> resp = handler.handleNoResource(ex);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(resp.getBody().getMessage()).isEqualTo("Resource not found");
    }

    @Test
    @DisplayName("Data integrity violation → 409 without leaking SQL details")
    void dataIntegrityMapped() {
        ResponseEntity<ApiErrorResponse> resp = handler.handleDataIntegrity(
                new DataIntegrityViolationException(
                        "could not execute statement [ERROR: duplicate key value violates unique constraint \"uk_x\"]"));

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(resp.getBody().getMessage()).isEqualTo("The request conflicts with existing data");
        assertThat(resp.getBody().getMessage()).doesNotContain("constraint");
    }

    @Test
    @DisplayName("Unexpected exception → safe generic 500, no internal details in body")
    void unexpectedExceptionSafe500() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/products");

        ResponseEntity<ApiErrorResponse> resp = handler.handleGeneral(
                new IllegalStateException("secret column p1_0.sort_order does not exist"), request);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(resp.getBody().getMessage()).isEqualTo("Internal server error");
        assertThat(resp.getBody().getMessage()).doesNotContain("sort_order");
        assertThat(resp.getBody().getError()).isEqualTo("INTERNAL_SERVER_ERROR");
    }
}
