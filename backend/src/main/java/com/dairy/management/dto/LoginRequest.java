package com.dairy.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Identifier is required")
    private String identifier; // email, username, or phone number

    /**
     * Optional. AUTO-DETECT if not provided:
     * - contains '@'  → EMAIL
     * - 10 digits     → PHONE
     * - otherwise     → USERNAME
     */
    private String identifierType; // EMAIL | USERNAME | PHONE

    @NotBlank(message = "Password is required")
    private String password;

    private boolean rememberMe = false;
}
