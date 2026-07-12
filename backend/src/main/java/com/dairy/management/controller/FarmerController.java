package com.dairy.management.controller;

import com.dairy.management.dto.FarmerStatsResponse;
import com.dairy.management.dto.MilkCollectionRequest;
import com.dairy.management.dto.MilkCollectionResponse;
import com.dairy.management.entity.User;
import com.dairy.management.exception.ApiException;
import com.dairy.management.repository.UserRepository;
import com.dairy.management.service.FarmerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farmer")
@RequiredArgsConstructor
public class FarmerController {

    private final FarmerService farmerService;
    private final UserRepository userRepository;

    @PostMapping("/milk-collection")
    public ResponseEntity<MilkCollectionResponse> addEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MilkCollectionRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(farmerService.addEntry(resolveUserId(userDetails), req));
    }

    @GetMapping("/milk-collection")
    public ResponseEntity<List<MilkCollectionResponse>> getMyEntries(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(farmerService.getMyEntries(resolveUserId(userDetails)));
    }

    @GetMapping("/stats")
    public ResponseEntity<FarmerStatsResponse> getStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(farmerService.getStats(resolveUserId(userDetails)));
    }

    private Long resolveUserId(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED));
        return user.getId();
    }
}
