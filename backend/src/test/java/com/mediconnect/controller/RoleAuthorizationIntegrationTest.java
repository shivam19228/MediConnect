package com.mediconnect.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.dto.request.UpdatePatientProfileRequest;
import com.mediconnect.entity.PatientProfile;
import com.mediconnect.entity.Role;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.RoleType;
import com.mediconnect.repository.RoleRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RoleAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private User patient1;
    private User patient2;
    private User doctor;
    private User admin;

    private String patient1Token;
    private String patient2Token;
    private String doctorToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        Role patientRole = roleRepository.findByName(RoleType.PATIENT)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.PATIENT, "Patient role")));
        Role doctorRole = roleRepository.findByName(RoleType.DOCTOR)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.DOCTOR, "Doctor role")));
        Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ADMIN, "Admin role")));

        patient1 = userRepository.findByEmail("patient1.auth@test.com").orElseGet(() -> {
            User p = new User("patient1.auth@test.com", passwordEncoder.encode("Pass@123"), "Patient One", patientRole);
            p.setPatientProfile(new PatientProfile(p));
            return userRepository.save(p);
        });

        patient2 = userRepository.findByEmail("patient2.auth@test.com").orElseGet(() -> {
            User p = new User("patient2.auth@test.com", passwordEncoder.encode("Pass@123"), "Patient Two", patientRole);
            p.setPatientProfile(new PatientProfile(p));
            return userRepository.save(p);
        });

        doctor = userRepository.findByEmail("doctor.auth@test.com").orElseGet(() -> {
            User d = new User("doctor.auth@test.com", passwordEncoder.encode("Pass@123"), "Dr. Test Doctor", doctorRole);
            d.setSpecialty("General Practice");
            return userRepository.save(d);
        });

        admin = userRepository.findByEmail("admin.auth@test.com").orElseGet(() -> {
            User a = new User("admin.auth@test.com", passwordEncoder.encode("Pass@123"), "Test Admin", adminRole);
            return userRepository.save(a);
        });

        patient1Token = jwtUtils.generateTokenFromUser(patient1);
        patient2Token = jwtUtils.generateTokenFromUser(patient2);
        doctorToken = jwtUtils.generateTokenFromUser(doctor);
        adminToken = jwtUtils.generateTokenFromUser(admin);
    }

    @Test
    @DisplayName("PATIENT role accessing /api/v1/admin/overview should be rejected with 403 Forbidden")
    void patientAccessingAdminEndpointShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header("Authorization", "Bearer " + patient1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("DOCTOR role accessing /api/v1/admin/overview should be rejected with 403 Forbidden")
    void doctorAccessingAdminEndpointShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("ADMIN role accessing /api/v1/admin/overview should be authorized with 200 OK")
    void adminAccessingAdminEndpointShouldBeAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("PATIENT role accessing /api/v1/doctor/patients should be rejected with 403 Forbidden")
    void patientAccessingDoctorEndpointShouldBeForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/patients")
                        .header("Authorization", "Bearer " + patient1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("DOCTOR role accessing /api/v1/doctor/patients should be authorized with 200 OK")
    void doctorAccessingDoctorEndpointShouldBeAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/patients")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Patient Privacy: Patient 1 can access their own profile")
    void patientCanAccessOwnProfile() throws Exception {
        mockMvc.perform(get("/api/v1/users/" + patient1.getId())
                        .header("Authorization", "Bearer " + patient1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(patient1.getId()))
                .andExpect(jsonPath("$.email").value(patient1.getEmail()));
    }

    @Test
    @DisplayName("Patient Privacy: Patient 1 is FORBIDDEN from accessing Patient 2's private profile")
    void patientCannotAccessAnotherPatientProfile() throws Exception {
        mockMvc.perform(get("/api/v1/users/" + patient2.getId())
                        .header("Authorization", "Bearer " + patient1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Access is denied: Patients are only permitted to view their own private medical records."));
    }

    @Test
    @DisplayName("Patient Privacy: Doctor CAN access Patient 1's profile for clinical review")
    void doctorCanAccessPatientProfile() throws Exception {
        mockMvc.perform(get("/api/v1/users/" + patient1.getId())
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(patient1.getId()))
                .andExpect(jsonPath("$.email").value(patient1.getEmail()));
    }

    @Test
    @DisplayName("Patient Privacy: Admin CAN access Patient 1's profile for administrative review")
    void adminCanAccessPatientProfile() throws Exception {
        mockMvc.perform(get("/api/v1/users/" + patient1.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(patient1.getId()));
    }

    @Test
    @DisplayName("Patient Privacy: Patient 1 can update their own demographic profile")
    void patientCanUpdateOwnProfile() throws Exception {
        UpdatePatientProfileRequest updateRequest = new UpdatePatientProfileRequest();
        updateRequest.setFullName("Patient One Updated");
        updateRequest.setAge(48);
        updateRequest.setAddress("Lucknow, Uttar Pradesh");
        updateRequest.setPreferredLanguage("hi");

        mockMvc.perform(put("/api/v1/users/" + patient1.getId() + "/profile")
                        .header("Authorization", "Bearer " + patient1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Patient One Updated"))
                .andExpect(jsonPath("$.patientProfile.age").value(48))
                .andExpect(jsonPath("$.patientProfile.address").value("Lucknow, Uttar Pradesh"));
    }

    @Test
    @DisplayName("Patient Privacy: Patient 1 is FORBIDDEN from updating Patient 2's profile")
    void patientCannotUpdateAnotherPatientProfile() throws Exception {
        UpdatePatientProfileRequest updateRequest = new UpdatePatientProfileRequest();
        updateRequest.setFullName("Malicious Modification");

        mockMvc.perform(put("/api/v1/users/" + patient2.getId() + "/profile")
                        .header("Authorization", "Bearer " + patient1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Access is denied: Patients are only permitted to modify their own private medical records."));
    }
}
