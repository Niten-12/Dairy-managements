package com.dairy.management.service;

import com.dairy.management.dto.ProfileResponse;
import com.dairy.management.dto.UpdatePasswordRequest;
import com.dairy.management.dto.UpdateProfileRequest;
import com.dairy.management.entity.User;
import com.dairy.management.exception.ApiException;
import com.dairy.management.repository.UserRepository;
import com.dairy.management.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public ProfileResponse getProfile(String email) {
        User user = findUser(email);
        return toProfileResponse(user, null);
    }

    public ProfileResponse updateProfile(String email, UpdateProfileRequest req) {
        User user = findUser(email);

        String newEmail = req.getEmail().trim().toLowerCase();

        if (!newEmail.equals(user.getEmail()) &&
                userRepository.existsByEmailAndIdNot(newEmail, user.getId())) {
            throw new ApiException("Email is already taken", HttpStatus.CONFLICT);
        }

        user.setName(req.getName().trim());
        user.setEmail(newEmail);
        user.setPhone(req.getPhone() != null ? req.getPhone().trim() : null);
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String newToken = jwtUtil.generateToken(userDetails);

        return toProfileResponse(user, newToken);
    }

    public void updatePassword(String email, UpdatePasswordRequest req) {
        User user = findUser(email);

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new ApiException("Current password is incorrect", HttpStatus.BAD_REQUEST);
        }

        if (req.getCurrentPassword().equals(req.getNewPassword())) {
            throw new ApiException("New password must be different from current password", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
    }

    private ProfileResponse toProfileResponse(User user, String token) {
        return ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .token(token)
                .build();
    }
}
