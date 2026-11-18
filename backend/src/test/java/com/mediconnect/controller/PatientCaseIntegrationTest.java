package com.mediconnect.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.dto.request.CaseAnswerDto;
import com.mediconnect.dto.request.CreateCaseDraftRequest;
import com.mediconnect.dto.request.MedicalHistoryDto;
import com.mediconnect.dto.request.SaveCaseAnswersRequest;
import com.mediconnect.dto.request.UpdateCaseDraftRequest;
import com.mediconnect.entity.Role;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.RoleType;
import com.mediconnect.entity.enums.SeverityLevel;
import com.mediconnect.repository.PatientCaseRepository;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PatientCaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PatientCaseRepository patientCaseRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private User patientA;
    private User patientB;
    private User doctor;

    private String patientAToken;
    private String patientBToken;
    private String doctorToken;

    @BeforeEach
    void setUp() {
        Role patientRole = roleRepository.findByName(RoleType.PATIENT)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.PATIENT, "Patient role")));
        Role doctorRole = roleRepository.findByName(RoleType.DOCTOR)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.DOCTOR, "Doctor role")));

        patientA = userRepository.findByEmail("case.patient.a@test.com").orElseGet(() -> {
            User p = new User("case.patient.a@test.com", passwordEncoder.encode("Pass@123"), "Sunita Devi", patientRole);
            p.setPhone("+91 98111 22334");
            return userRepository.save(p);
        });

        patientB = userRepository.findByEmail("case.patient.b@test.com").orElseGet(() -> {
            User p = new User("case.patient.b@test.com", passwordEncoder.encode("Pass@123"), "Ramesh Sharma", patientRole);
            p.setPhone("+91 98222 33445");
            return userRepository.save(p);
        });

        doctor = userRepository.findByEmail("case.doctor@test.com").orElseGet(() -> {
            User d = new User("case.doctor@test.com", passwordEncoder.encode("Pass@123"), "Dr. Anita Desai", doctorRole);
            d.setSpecialty("Internal Medicine");
            return userRepository.save(d);
        });

        patientAToken = jwtUtils.generateTokenFromUser(patientA);
        patientBToken = jwtUtils.generateTokenFromUser(patientB);
        doctorToken = jwtUtils.generateTokenFromUser(doctor);
    }

    @Test
    @DisplayName("Should create a case draft successfully with default status DRAFT")
    void shouldCreateCaseDraftSuccessfully() throws Exception {
        CreateCaseDraftRequest request = new CreateCaseDraftRequest();
        request.setLanguage("hi");
        request.setPrimarySymptoms(List.of("fever", "cough"));
        request.setSeverity(SeverityLevel.MODERATE);

        mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.patientId").value(patientA.getId()))
                .andExpect(jsonPath("$.patientName").value("Sunita Devi"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.primarySymptoms[0]").value("fever"));
    }

    @Test
    @DisplayName("Should reject unauthenticated case creation with 401 Unauthorized")
    void shouldRejectUnauthenticatedAccess() throws Exception {
        mockMvc.perform(post("/api/v1/cases")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        mockMvc.perform(get("/api/v1/cases"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Should retrieve only the authenticated patient's own cases")
    void shouldRetrieveAuthenticatedPatientOwnCases() throws Exception {
        CreateCaseDraftRequest request1 = new CreateCaseDraftRequest();
        request1.setPrimarySymptoms(List.of("fever"));
        mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        // Patient A fetches own cases
        mockMvc.perform(get("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].patientId").value(patientA.getId()));
    }

    @Test
    @DisplayName("Cross-patient isolation: Patient B cannot view Patient A's case draft")
    void crossPatientIsolationShouldPreventViewingAnotherCase() throws Exception {
        // Patient A creates a draft
        CreateCaseDraftRequest request = new CreateCaseDraftRequest();
        request.setPrimarySymptoms(List.of("fever"));
        String res = mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String caseId = objectMapper.readTree(res).get("id").asText();

        // Patient A can access it
        mockMvc.perform(get("/api/v1/cases/" + caseId)
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isOk());

        // Patient B is rejected with 403 Forbidden
        mockMvc.perform(get("/api/v1/cases/" + caseId)
                        .header("Authorization", "Bearer " + patientBToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Access is denied: You are not authorized to access another patient's medical case."));

        // Doctor is permitted to view
        mockMvc.perform(get("/api/v1/cases/" + caseId)
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should update case draft while in DRAFT status and reject Patient B updates")
    void shouldUpdateDraftSuccessfully() throws Exception {
        CreateCaseDraftRequest create = new CreateCaseDraftRequest();
        create.setPrimarySymptoms(List.of("headache"));
        String res = mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String caseId = objectMapper.readTree(res).get("id").asText();

        UpdateCaseDraftRequest update = new UpdateCaseDraftRequest();
        update.setPrimarySymptoms(List.of("headache", "fever"));
        update.setSeverity(SeverityLevel.SEVERE);
        update.setDuration("4 days");

        // Patient A updates own draft
        mockMvc.perform(put("/api/v1/cases/" + caseId)
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duration").value("4 days"))
                .andExpect(jsonPath("$.severity").value("Severe"));

        // Patient B cannot update Patient A's draft
        mockMvc.perform(put("/api/v1/cases/" + caseId)
                        .header("Authorization", "Bearer " + patientBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should save and retrieve structured questionnaire answers")
    void shouldSaveAndRetrieveQuestionnaireAnswers() throws Exception {
        CreateCaseDraftRequest create = new CreateCaseDraftRequest();
        String res = mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String caseId = objectMapper.readTree(res).get("id").asText();

        SaveCaseAnswersRequest answersRequest = new SaveCaseAnswersRequest(List.of(
                new CaseAnswerDto("fever_duration", "Fever duration?", "4_7_days", false),
                new CaseAnswerDto("shared_severity", "Severity on scale?", "8", true)
        ));

        mockMvc.perform(put("/api/v1/cases/" + caseId + "/answers")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(answersRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.symptomAnswers").isArray())
                .andExpect(jsonPath("$.symptomAnswers[0].questionId").value("fever_duration"))
                .andExpect(jsonPath("$.symptomAnswers[1].audioUsed").value(true));
    }

    @Test
    @DisplayName("Should save, retrieve, and isolate medical history")
    void shouldSaveAndRetrieveMedicalHistory() throws Exception {
        CreateCaseDraftRequest create = new CreateCaseDraftRequest();
        String res = mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String caseId = objectMapper.readTree(res).get("id").asText();

        MedicalHistoryDto historyDto = new MedicalHistoryDto(
                "Type 2 Diabetes",
                "Metformin 500mg",
                "Penicillin allergy",
                "None",
                "Mother had hypertension",
                true
        );

        mockMvc.perform(put("/api/v1/cases/" + caseId + "/medical-history")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(historyDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conditions").value("Type 2 Diabetes"))
                .andExpect(jsonPath("$.allergies").value("Penicillin allergy"))
                .andExpect(jsonPath("$.provided").value(true));

        // Retrieve medical history for case
        mockMvc.perform(get("/api/v1/cases/" + caseId + "/medical-history")
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conditions").value("Type 2 Diabetes"));

        // Patient B is rejected from retrieving Patient A's case medical history
        mockMvc.perform(get("/api/v1/cases/" + caseId + "/medical-history")
                        .header("Authorization", "Bearer " + patientBToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should reject submission if required symptoms or duration are missing")
    void shouldRejectSubmissionIfIncomplete() throws Exception {
        CreateCaseDraftRequest create = new CreateCaseDraftRequest();
        create.setDuration(""); // missing duration
        create.setPrimarySymptoms(List.of()); // missing symptoms

        String res = mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String caseId = objectMapper.readTree(res).get("id").asText();

        // Attempt submit incomplete draft
        mockMvc.perform(post("/api/v1/cases/" + caseId + "/submit")
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("At least one primary symptom is required to submit a case."));
    }

    @Test
    @DisplayName("Should successfully submit case, generate unique token, and lock draft against modification")
    void shouldSubmitCaseSuccessfullyAndLockDraft() throws Exception {
        CreateCaseDraftRequest create = new CreateCaseDraftRequest();
        create.setPrimarySymptoms(List.of("fever", "joint_pain"));
        create.setDuration("3 days");
        create.setSeverity(SeverityLevel.SEVERE);

        String res = mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String caseId = objectMapper.readTree(res).get("id").asText();

        // Submit the case
        String submitRes = mockMvc.perform(post("/api/v1/cases/" + caseId + "/submit")
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.token.tokenNumber").isString())
                .andExpect(jsonPath("$.token.status").value("Submitted — Awaiting Doctor Review"))
                .andReturn().getResponse().getContentAsString();

        String tokenNumber = objectMapper.readTree(submitRes).get("token").get("tokenNumber").asText();
        assertThat(tokenNumber).startsWith("MC-");

        // Attempting to update a SUBMITTED case must be rejected with 400 Bad Request
        UpdateCaseDraftRequest update = new UpdateCaseDraftRequest();
        update.setDuration("10 days");
        mockMvc.perform(put("/api/v1/cases/" + caseId)
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        // Attempting to re-submit must be rejected with 400 Bad Request
        mockMvc.perform(post("/api/v1/cases/" + caseId + "/submit")
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("Should generate sequential, distinct tokens for multiple submissions")
    void shouldGenerateSequentialDistinctTokens() throws Exception {
        // Submit case 1
        CreateCaseDraftRequest c1 = new CreateCaseDraftRequest();
        c1.setPrimarySymptoms(List.of("cough"));
        c1.setDuration("2 days");
        String res1 = mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(c1)))
                .andReturn().getResponse().getContentAsString();
        String id1 = objectMapper.readTree(res1).get("id").asText();

        String sub1 = mockMvc.perform(post("/api/v1/cases/" + id1 + "/submit")
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token1 = objectMapper.readTree(sub1).get("token").get("tokenNumber").asText();

        // Submit case 2
        CreateCaseDraftRequest c2 = new CreateCaseDraftRequest();
        c2.setPrimarySymptoms(List.of("headache"));
        c2.setDuration("1 day");
        String res2 = mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", "Bearer " + patientAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(c2)))
                .andReturn().getResponse().getContentAsString();
        String id2 = objectMapper.readTree(res2).get("id").asText();

        String sub2 = mockMvc.perform(post("/api/v1/cases/" + id2 + "/submit")
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token2 = objectMapper.readTree(sub2).get("token").get("tokenNumber").asText();

        assertThat(token1).isNotEqualTo(token2);
    }
}
