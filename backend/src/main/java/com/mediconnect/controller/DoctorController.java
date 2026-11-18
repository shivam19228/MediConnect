package com.mediconnect.controller;

import com.mediconnect.dto.response.UserProfileResponse;
import com.mediconnect.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctor")
@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
public class DoctorController {

    private final UserService userService;

    public DoctorController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/patients")
    public ResponseEntity<List<UserProfileResponse>> getAllPatients() {
        List<UserProfileResponse> patients = userService.getAllPatients();
        return ResponseEntity.ok(patients);
    }
}
