package com.mediconnect.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.dto.request.LoginRequest;
import com.mediconnect.dto.request.RegisterRequest;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        if (!roleRepository.existsByName(RoleType.PATIENT)) {
            roleRepository.save(new Role(RoleType.PATIENT, "Patient role"));
        }
        if (!roleRepository.existsByName(RoleType.DOCTOR)) {
            roleRepository.save(new Role(RoleType.DOCTOR, "Doctor role"));
        }
        if (!roleRepository.existsByName(RoleType.ADMIN)) {
            roleRepository.save(new Role(RoleType.ADMIN, "Admin role"));
        }
    }

    @Test
    @DisplayName("Should successfully register a new PATIENT account")
    void shouldRegisterPatientSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "new.patient@test.com",
                "Password@123",
                "New Patient User",
                RoleType.PATIENT
        );
        request.setPhone("+91 99999 11111");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("new.patient@test.com"))
                .andExpect(jsonPath("$.user.role").value("PATIENT"))
                .andExpect(jsonPath("$.user.name").value("New Patient User"));

        assertThat(userRepository.findByEmail("new.patient@test.com")).isPresent();
    }

    @Test
    @DisplayName("Should successfully register a new DOCTOR account with specialty")
    void shouldRegisterDoctorSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "new.doctor@test.com",
                "DoctorPass@123",
                "Dr. Vikram Sarabhai",
                RoleType.DOCTOR
        );
        request.setSpecialty("Cardiology");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.role").value("DOCTOR"))
                .andExpect(jsonPath("$.user.specialty").value("Cardiology"));
    }

    @Test
    @DisplayName("Should reject duplicate email registration with 409 Conflict")
    void shouldRejectDuplicateEmailRegistration() throws Exception {
        RegisterRequest request1 = new RegisterRequest(
                "duplicate@test.com",
                "Password@123",
                "Duplicate One",
                RoleType.PATIENT
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        // Attempt registering with the same email
        RegisterRequest request2 = new RegisterRequest(
                "duplicate@test.com",
                "DifferentPass@123",
                "Duplicate Two",
                RoleType.PATIENT
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("An account with email duplicate@test.com already exists."));
    }

    @Test
    @DisplayName("Should prevent self-registration as ADMIN with 403 Forbidden")
    void shouldPreventSelfRegistrationAsAdmin() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "hacker.admin@test.com",
                "AdminPassword@123",
                "Fake Admin",
                RoleType.ADMIN
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Self-registration as ADMIN is prohibited. Administrative accounts must be provisioned by system administrators."));
    }

    @Test
    @DisplayName("Should return 400 Bad Request when registration payload fails validation")
    void shouldRejectInvalidRegistrationPayload() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest(
                "invalid-email-format",
                "123", // too short (< 6)
                "",    // blank name
                RoleType.PATIENT
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.password").exists())
                .andExpect(jsonPath("$.validationErrors.fullName").exists());
    }

    @Test
    @DisplayName("Should successfully authenticate valid credentials and return JWT token")
    void shouldLoginSuccessfullyWithValidCredentials() throws Exception {
        // Register user first
        RegisterRequest register = new RegisterRequest(
                "login.user@test.com",
                "Secret@123",
                "Login Test User",
                RoleType.PATIENT
        );
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        // Perform login
        LoginRequest login = new LoginRequest("login.user@test.com", "Secret@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("login.user@test.com"));
    }

    @Test
    @DisplayName("Should reject invalid password with 401 Unauthorized")
    void shouldRejectInvalidPassword() throws Exception {
        RegisterRequest register = new RegisterRequest(
                "wrong.pass@test.com",
                "CorrectPassword@123",
                "Password Test",
                RoleType.PATIENT
        );
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        LoginRequest wrongLogin = new LoginRequest("wrong.pass@test.com", "WrongPassword@999");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("Should reject login for non-existent user with 401 Unauthorized")
    void shouldRejectNonExistentUserLogin() throws Exception {
        LoginRequest login = new LoginRequest("ghost@test.com", "AnyPassword@123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Should access /api/v1/auth/me with valid Bearer token")
    void shouldAccessAuthMeWithValidToken() throws Exception {
        RegisterRequest register = new RegisterRequest(
                "me.test@test.com",
                "Pass@12345",
                "Me Endpoint Test",
                RoleType.PATIENT
        );
        String regResponse = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(regResponse).get("token").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me.test@test.com"))
                .andExpect(jsonPath("$.fullName").value("Me Endpoint Test"))
                .andExpect(jsonPath("$.role").value("PATIENT"));
    }

    @Test
    @DisplayName("Should reject /api/v1/auth/me with 401 Unauthorized when token is missing")
    void shouldRejectAuthMeWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Should reject /api/v1/auth/me with 401 Unauthorized when token is tampered/invalid")
    void shouldRejectAuthMeWithInvalidToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer invalid.token.signature"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Should reject /api/v1/auth/me with 401 Unauthorized when token is expired")
    void shouldRejectAuthMeWithExpiredToken() throws Exception {
        Role role = roleRepository.findByName(RoleType.PATIENT).orElseThrow();
        User testUser = new User("expired.auth@test.com", "hash", "Expired Auth", role);
        testUser = userRepository.save(testUser);

        // Generate expired token
        JwtUtils expiredJwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(
                expiredJwtUtils,
                "jwtSecret",
                "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"
        );
        ReflectionTestUtils.setField(expiredJwtUtils, "jwtExpirationMs", -5000L); // expired 5 seconds ago
        String expiredToken = expiredJwtUtils.generateTokenFromUser(testUser);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
