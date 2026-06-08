package com.dairy.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyTwoFactorLoginRequest {

    @NotBlank(message = "Temp token is required")
    private String tempToken;

    @NotBlank(message = "Code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "Code must be 6 digits")
    private String code;
}
