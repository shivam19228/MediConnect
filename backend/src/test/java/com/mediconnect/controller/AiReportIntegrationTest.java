package com.mediconnect.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.client.gemini.GeminiClient;
import com.mediconnect.dto.ai.GeminiReportResult;
import com.mediconnect.dto.ai.StructuredClinicalSummaryDto;
import com.mediconnect.entity.CaseAnswer;
import com.mediconnect.entity.DoctorReview;
import com.mediconnect.entity.IntakeToken;
import com.mediconnect.entity.MedicalHistory;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.Role;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.ReviewStatus;
import com.mediconnect.entity.enums.RoleType;
import com.mediconnect.entity.enums.SeverityLevel;
import com.mediconnect.exception.GeminiConfigurationException;
import com.mediconnect.exception.GeminiServiceException;
import com.mediconnect.repository.GeneratedCaseReportRepository;
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
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiReportIntegrationTest {

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
    private GeneratedCaseReportRepository generatedCaseReportRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @MockBean
    private GeminiClient geminiClient;

    private User doctor;
    private User admin;
    private User patient;

    private String doctorToken;
    private String adminToken;
    private String patientToken;

    @BeforeEach
    void setUp() {
        Role doctorRole = roleRepository.findByName(RoleType.DOCTOR)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.DOCTOR, "Doctor role")));
        Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ADMIN, "Admin role")));
        Role patientRole = roleRepository.findByName(RoleType.PATIENT)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.PATIENT, "Patient role")));

        doctor = userRepository.findByEmail("ai.doc@test.com").orElseGet(() -> {
            User u = new User("ai.doc@test.com", passwordEncoder.encode("Pass@123"), "Dr. Sanjeev Kumar", doctorRole);
            u.setSpecialty("Emergency Medicine");
            return userRepository.save(u);
        });

        admin = userRepository.findByEmail("ai.admin@test.com").orElseGet(() -> {
            User u = new User("ai.admin@test.com", passwordEncoder.encode("Pass@123"), "Admin Supervisor", adminRole);
            return userRepository.save(u);
        });

        patient = userRepository.findByEmail("ai.patient@test.com").orElseGet(() -> {
            User u = new User("ai.patient@test.com", passwordEncoder.encode("Pass@123"), "Meena Kumari", patientRole);
            return userRepository.save(u);
        });

        doctorToken = jwtUtils.generateTokenFromUser(doctor);
        adminToken = jwtUtils.generateTokenFromUser(admin);
        patientToken = jwtUtils.generateTokenFromUser(patient);
    }

    private PatientCase createSubmittedCase() {
        PatientCase patientCase = new PatientCase("Meena Kumari", "hi", SeverityLevel.SEVERE);
        patientCase.setPatient(patient);
        patientCase.setPatientAge(50);
        patientCase.setPatientGender("Female");
        patientCase.setDuration("4 days");
        patientCase.setIsEmergencyFlagged(false);
        patientCase.setStatus(CaseStatus.SUBMITTED);
        patientCase.setPrimarySymptoms(new ArrayList<>(List.of("fever", "persistent_cough")));

        IntakeToken token = new IntakeToken();
        token.setTokenNumber("MC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        token.setSubmittedAt(LocalDateTime.now());
        token.setStatus("Submitted — Awaiting Doctor Review");
        patientCase.setIntakeToken(token);

        DoctorReview review = new DoctorReview();
        review.setStatus(ReviewStatus.PENDING_REVIEW);
        patientCase.setDoctorReview(review);

        CaseAnswer answer = new CaseAnswer("Q1", "Any chest pain?", "Mild pressure on coughing", false);
        patientCase.addSymptomAnswer(answer);

        MedicalHistory history = new MedicalHistory();
        history.setConditions("Type 2 Diabetes");
        history.setMedications("Metformin 500mg");
        history.setAllergies("Sulfa drugs");
        history.setProvided(true);
        patientCase.setMedicalHistory(history);

        return patientCaseRepository.save(patientCase);
    }

    private GeminiReportResult createSampleMockResult() {
        StructuredClinicalSummaryDto summary = new StructuredClinicalSummaryDto();
        summary.setChiefComplaint("Persistent febrile illness and productive cough for 4 days");
        summary.setHistoryOfPresentIllness("50yo female presents with 4-day history of fever, worsening cough, and mild chest discomfort with coughing.");
        summary.setSymptomDurationAndSeverity("4 days duration; reported severe intensity with constitutional symptoms.");
        summary.setAssociatedSymptoms("Mild chest pressure on coughing.");
        summary.setRelevantMedicalHistory("Pre-existing Type 2 Diabetes on Metformin.");
        summary.setCurrentMedicines("Metformin 500mg daily.");
        summary.setKnownAllergies("Documented allergy to Sulfa drugs.");
        summary.setPreviousMedicalReports("None provided.");
        summary.setPatientReportedInformation("Patient notes symptoms worsened over the last 48 hours.");
        summary.setMissingOrUnansweredInfo("Oxygen saturation and lung auscultation not yet performed.");
        summary.setItemsRequiringDoctorReview("Chest auscultation for crackles, SpO2 check, and consider chest radiography.");

        return new GeminiReportResult(summary, "gemini-1.5-flash", 280, 160, 440);
    }

    @Test
    @DisplayName("Doctor can generate structured AI clinical report successfully")
    void testGenerateReport_AsDoctor_Success() throws Exception {
        PatientCase pc = createSubmittedCase();
        when(geminiClient.generateClinicalSummary(any())).thenReturn(createSampleMockResult());

        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/generate-report")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.chiefComplaint").value("Persistent febrile illness and productive cough for 4 days"))
                .andExpect(jsonPath("$.historyOfPresentIllness").isNotEmpty())
                .andExpect(jsonPath("$.itemsRequiringDoctorReview").value(containsString("Chest auscultation")))
                .andExpect(jsonPath("$.missingOrUnansweredInfo").value(containsString("Oxygen saturation")))
                .andExpect(jsonPath("$.isDemoGenerated").value(false))
                .andExpect(jsonPath("$.modelName").value("gemini-1.5-flash"))
                .andExpect(jsonPath("$.promptTokens").value(280))
                .andExpect(jsonPath("$.completionTokens").value(160))
                .andExpect(jsonPath("$.disclaimer").value(containsString("Not a confirmed medical diagnosis")));

        // Verify database persistence
        PatientCase updated = patientCaseRepository.findById(pc.getId()).orElseThrow();
        assertThat(updated.getGeneratedReport()).isNotNull();
        assertThat(updated.getGeneratedReport().getIsDemoGenerated()).isFalse();
        assertThat(updated.getGeneratedReport().getChiefComplaint()).contains("Persistent febrile illness");
    }

    @Test
    @DisplayName("Regenerating AI report updates existing report cleanly without creating duplicate records")
    void testGenerateReport_IdempotentRegenerate_UpdatesExisting() throws Exception {
        PatientCase pc = createSubmittedCase();
        when(geminiClient.generateClinicalSummary(any())).thenReturn(createSampleMockResult());

        // First generation
        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/generate-report")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Second generation (regenerate)
        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/generate-report")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Ensure exactly 1 report exists for this case
        long count = generatedCaseReportRepository.findAll().stream()
                .filter(r -> r.getPatientCase().getId().equals(pc.getId()))
                .count();
        assertThat(count).isEqualTo(1);
    }

    @Test
    @DisplayName("Doctor can retrieve an existing generated AI report")
    void testGetCaseReport_Success() throws Exception {
        PatientCase pc = createSubmittedCase();
        when(geminiClient.generateClinicalSummary(any())).thenReturn(createSampleMockResult());

        // Generate first
        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/generate-report")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        // Retrieve
        mockMvc.perform(get("/api/v1/doctor/cases/" + pc.getId() + "/report")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chiefComplaint").value("Persistent febrile illness and productive cough for 4 days"))
                .andExpect(jsonPath("$.disclaimer").isNotEmpty());
    }

    @Test
    @DisplayName("Retrieving report when none has been generated returns 404 Not Found")
    void testGetCaseReport_NotFound() throws Exception {
        PatientCase pc = createSubmittedCase();

        mockMvc.perform(get("/api/v1/doctor/cases/" + pc.getId() + "/report")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No AI clinical report has been generated for case id: " + pc.getId()));
    }

    @Test
    @DisplayName("Attempting to generate report on draft case returns 400 Bad Request")
    void testGenerateReport_DraftCase_Returns400() throws Exception {
        PatientCase draftCase = new PatientCase("Draft Patient", "hi", SeverityLevel.MILD);
        draftCase.setPatient(patient);
        draftCase.setStatus(CaseStatus.DRAFT);
        PatientCase savedDraft = patientCaseRepository.save(draftCase);

        mockMvc.perform(post("/api/v1/doctor/cases/" + savedDraft.getId() + "/generate-report")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot generate an AI clinical report for a draft case. Case must be submitted first."));
    }

    @Test
    @DisplayName("Patient cannot call report generation endpoint (403 Forbidden)")
    void testGenerateReport_AsPatient_Forbidden() throws Exception {
        PatientCase pc = createSubmittedCase();

        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/generate-report")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request to report generation returns 401 Unauthorized")
    void testGenerateReport_Unauthenticated_Unauthorized() throws Exception {
        PatientCase pc = createSubmittedCase();

        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/generate-report")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Returns 502 Bad Gateway when Gemini provider fails")
    void testGenerateReport_ProviderFailure_Returns502() throws Exception {
        PatientCase pc = createSubmittedCase();
        when(geminiClient.generateClinicalSummary(any()))
                .thenThrow(new GeminiServiceException("Gemini AI service is currently unavailable. Please retry later."));

        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/generate-report")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error").value("Bad Gateway"))
                .andExpect(jsonPath("$.message").value("Gemini AI service is currently unavailable. Please retry later."));
    }

    @Test
    @DisplayName("Returns 503 Service Unavailable when Gemini API key is missing")
    void testGenerateReport_MissingApiKey_Returns503() throws Exception {
        PatientCase pc = createSubmittedCase();
        when(geminiClient.generateClinicalSummary(any()))
                .thenThrow(new GeminiConfigurationException("Gemini AI API key is not configured. Please set the GEMINI_API_KEY environment variable."));

        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/generate-report")
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("Service Unavailable"))
                .andExpect(jsonPath("$.message").value(containsString("GEMINI_API_KEY")));
    }

    @Test
    @DisplayName("Admin can also trigger report generation")
    void testGenerateReport_AsAdmin_Success() throws Exception {
        PatientCase pc = createSubmittedCase();
        when(geminiClient.generateClinicalSummary(any())).thenReturn(createSampleMockResult());

        mockMvc.perform(post("/api/v1/admin/cases/" + pc.getId() + "/generate-report")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chiefComplaint").isNotEmpty());
    }
}
