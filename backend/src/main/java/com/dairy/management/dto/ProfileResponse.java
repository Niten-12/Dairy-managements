package com.dairy.management.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String token;
}
