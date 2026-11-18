package com.mediconnect.controller;

import com.mediconnect.dto.response.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> getHealthStatus() {
        HealthResponse response = new HealthResponse(
                "UP",
                "MediConnect Backend API",
                "MediConnect core backend service is active and responsive",
                LocalDateTime.now()
        );
        return ResponseEntity.ok(response);
    }
}
