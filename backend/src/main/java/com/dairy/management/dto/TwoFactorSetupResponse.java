package com.dairy.management.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TwoFactorSetupResponse {
    private String secret;
    private String otpauthUrl;
}
