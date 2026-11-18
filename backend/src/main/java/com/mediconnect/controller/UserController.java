package com.mediconnect.controller;

import com.mediconnect.dto.request.UpdatePatientProfileRequest;
import com.mediconnect.dto.response.UserProfileResponse;
import com.mediconnect.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUserProfile(
            @PathVariable String id, Authentication authentication) {
        UserProfileResponse response = userService.getUserProfile(id, authentication);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<UserProfileResponse> updatePatientProfile(
            @PathVariable String id,
            @Valid @RequestBody UpdatePatientProfileRequest request,
            Authentication authentication) {
        UserProfileResponse response = userService.updatePatientProfile(id, request, authentication);
        return ResponseEntity.ok(response);
    }
}
