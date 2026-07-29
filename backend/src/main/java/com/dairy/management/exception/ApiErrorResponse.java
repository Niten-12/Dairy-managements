package com.dairy.management.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Single error contract for every non-2xx response, whether it is produced by
 * a controller advice or by the security layer (401/403 handlers).
 *
 * "message" is the user-safe text the frontend renders
 * (err.response?.data?.message); "error" is a stable machine-readable code;
 * "errors" carries field-level detail for validation failures only.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private final LocalDateTime timestamp;
    private final int status;
    private final String error;
    private final String message;
    private final Map<String, String> errors;

    public static ApiErrorResponse of(HttpStatus status, String message) {
        return of(status, status.name(), message);
    }

    public static ApiErrorResponse of(HttpStatus status, String errorCode, String message) {
        return ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(errorCode)
                .message(message)
                .build();
    }
}
