package com.dairy.management.controller;

import com.dairy.management.dto.TwoFactorCodeRequest;
import com.dairy.management.dto.TwoFactorSetupResponse;
import com.dairy.management.service.TwoFactorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final TwoFactorService twoFactorService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getStatus(@AuthenticationPrincipal UserDetails userDetails) {
        boolean enabled = twoFactorService.isTwoFactorEnabled(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("twoFactorEnabled", enabled));
    }

    @PostMapping("/setup")
    public ResponseEntity<TwoFactorSetupResponse> setup(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(twoFactorService.generateSetup(userDetails.getUsername()));
    }

    @PostMapping("/enable")
    public ResponseEntity<Map<String, String>> enable(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TwoFactorCodeRequest request) {
        twoFactorService.enableTwoFactor(userDetails.getUsername(), request.getCode());
        return ResponseEntity.ok(Map.of("message", "Two-factor authentication enabled successfully"));
    }

    @PostMapping("/disable")
    public ResponseEntity<Map<String, String>> disable(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TwoFactorCodeRequest request) {
        twoFactorService.disableTwoFactor(userDetails.getUsername(), request.getCode());
        return ResponseEntity.ok(Map.of("message", "Two-factor authentication disabled successfully"));
    }
}
