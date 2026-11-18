package com.mediconnect.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.dto.request.CaseAnswerDto;
import com.mediconnect.dto.request.MedicalHistoryDto;
import com.mediconnect.dto.request.SubmitDoctorReviewRequest;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DoctorCaseIntegrationTest {

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

    private User doctor1;
    private User doctor2;
    private User admin;
    private User patient;

    private String doctor1Token;
    private String doctor2Token;
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

        doctor1 = userRepository.findByEmail("dr.priya@test.com").orElseGet(() -> {
            User u = new User("dr.priya@test.com", passwordEncoder.encode("Pass@123"), "Dr. Priya Patel", doctorRole);
            u.setSpecialty("Cardiology");
            return userRepository.save(u);
        });

        doctor2 = userRepository.findByEmail("dr.vikram@test.com").orElseGet(() -> {
            User u = new User("dr.vikram@test.com", passwordEncoder.encode("Pass@123"), "Dr. Vikram Singh", doctorRole);
            u.setSpecialty("General Medicine");
            return userRepository.save(u);
        });

        admin = userRepository.findByEmail("admin.lead@test.com").orElseGet(() -> {
            User u = new User("admin.lead@test.com", passwordEncoder.encode("Pass@123"), "System Administrator", adminRole);
            return userRepository.save(u);
        });

        patient = userRepository.findByEmail("patient.user@test.com").orElseGet(() -> {
            User u = new User("patient.user@test.com", passwordEncoder.encode("Pass@123"), "Kavita Sharma", patientRole);
            u.setPhone("+91 99887 76655");
            return userRepository.save(u);
        });

        doctor1Token = jwtUtils.generateTokenFromUser(doctor1);
        doctor2Token = jwtUtils.generateTokenFromUser(doctor2);
        adminToken = jwtUtils.generateTokenFromUser(admin);
        patientToken = jwtUtils.generateTokenFromUser(patient);
    }

    private PatientCase createAndSaveSubmittedCase(
            String patientName,
            SeverityLevel severity,
            boolean isEmergency,
            List<String> symptoms,
            String duration) {

        PatientCase patientCase = new PatientCase(patientName, "hi", severity);
        patientCase.setPatient(patient);
        patientCase.setPatientAge(42);
        patientCase.setPatientGender("Female");
        patientCase.setPatientPhone("+91 99887 76655");
        patientCase.setDuration(duration);
        patientCase.setIsEmergencyFlagged(isEmergency);
        patientCase.setStatus(CaseStatus.SUBMITTED);
        patientCase.setPrimarySymptoms(new ArrayList<>(symptoms));

        IntakeToken token = new IntakeToken();
        token.setTokenNumber("MC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        token.setSubmittedAt(LocalDateTime.now());
        token.setDayOfWeek("Tuesday");
        token.setFormattedDate("27 October 2026");
        token.setFormattedTime("04:30 PM");
        token.setStatus("Submitted — Awaiting Doctor Review");
        token.setDepartment("General Medicine & Triage");
        token.setLocale("hi-IN");
        patientCase.setIntakeToken(token);

        DoctorReview review = new DoctorReview();
        review.setStatus(isEmergency ? ReviewStatus.URGENT : ReviewStatus.PENDING_REVIEW);
        review.setDoctorNotes("");
        review.setFollowUpRequired(false);
        patientCase.setDoctorReview(review);

        CaseAnswer answer = new CaseAnswer("Q1", "When did the fever start?", "3 days ago", false);
        patientCase.addSymptomAnswer(answer);

        MedicalHistory history = new MedicalHistory();
        history.setConditions("Hypertension");
        history.setMedications("Amlodipine 5mg");
        history.setAllergies("Penicillin");
        history.setProvided(true);
        patientCase.setMedicalHistory(history);

        return patientCaseRepository.save(patientCase);
    }

    @Test
    @DisplayName("Doctor can list submitted cases and response omits patient personal contact info")
    void testGetDoctorCases_SuccessAndOmitsPatientContactInfo() throws Exception {
        createAndSaveSubmittedCase("Rohan Gupta", SeverityLevel.MODERATE, false, List.of("fever", "cough"), "3 days");

        mockMvc.perform(get("/api/v1/doctor/cases")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].caseId").exists())
                .andExpect(jsonPath("$.content[0].tokenNumber").exists())
                .andExpect(jsonPath("$.content[0].severity").exists())
                .andExpect(jsonPath("$.content[0].primarySymptoms").isArray())
                .andExpect(jsonPath("$.content[0].reviewStatus").exists())
                // Ensure patient contact details are NOT leaked in list responses
                .andExpect(jsonPath("$.content[0].patientName").doesNotExist())
                .andExpect(jsonPath("$.content[0].patientPhone").doesNotExist())
                .andExpect(jsonPath("$.content[0].patientEmail").doesNotExist());
    }

    @Test
    @DisplayName("Pagination parameters work correctly on doctor case list")
    void testGetDoctorCases_PaginationWorks() throws Exception {
        for (int i = 0; i < 3; i++) {
            createAndSaveSubmittedCase("Patient " + i, SeverityLevel.MILD, false, List.of("fatigue"), "2 days");
        }

        mockMvc.perform(get("/api/v1/doctor/cases")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .param("page", "0")
                        .param("size", "2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pageSize").value(2))
                .andExpect(jsonPath("$.pageNumber").value(0))
                .andExpect(jsonPath("$.content.length()").value(2));
    }

    @Test
    @DisplayName("Doctor can filter cases by review status")
    void testGetDoctorCases_FilterByStatus() throws Exception {
        createAndSaveSubmittedCase("Test Patient", SeverityLevel.MODERATE, false, List.of("headache"), "1 day");

        mockMvc.perform(get("/api/v1/doctor/cases")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .param("status", "PENDING_REVIEW")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("Doctor can filter cases by urgentOnly=true")
    void testGetDoctorCases_FilterUrgentOnly() throws Exception {
        createAndSaveSubmittedCase("Emergency Patient", SeverityLevel.SEVERE, true, List.of("chest_discomfort"), "1 hour");

        mockMvc.perform(get("/api/v1/doctor/cases")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .param("urgentOnly", "true")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].isEmergencyFlagged").value(true));
    }

    @Test
    @DisplayName("Doctor can retrieve complete clinical details of a submitted case")
    void testGetDoctorCaseDetail_Success() throws Exception {
        PatientCase pc = createAndSaveSubmittedCase("Aakash Mehra", SeverityLevel.SEVERE, false, List.of("high_fever"), "4 days");

        mockMvc.perform(get("/api/v1/doctor/cases/" + pc.getId())
                        .header("Authorization", "Bearer " + doctor1Token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(pc.getId()))
                .andExpect(jsonPath("$.patientAge").value(42))
                .andExpect(jsonPath("$.patientGender").value("Female"))
                .andExpect(jsonPath("$.token.tokenNumber").exists())
                .andExpect(jsonPath("$.symptomAnswers").isArray())
                .andExpect(jsonPath("$.symptomAnswers[0].questionText").value("When did the fever start?"))
                .andExpect(jsonPath("$.medicalHistory.conditions").value("Hypertension"))
                .andExpect(jsonPath("$.review.status").value("PENDING_REVIEW"));
    }

    @Test
    @DisplayName("Patient cannot access doctor endpoints (403 Forbidden)")
    void testPatientCannotAccessDoctorEndpoints() throws Exception {
        PatientCase pc = createAndSaveSubmittedCase("Confidential Case", SeverityLevel.MILD, false, List.of("sore_throat"), "2 days");

        // List endpoint
        mockMvc.perform(get("/api/v1/doctor/cases")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        // Detail endpoint
        mockMvc.perform(get("/api/v1/doctor/cases/" + pc.getId())
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request to doctor endpoints returns 401 Unauthorized")
    void testUnauthenticatedAccessReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/cases")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Doctor can successfully submit a review marking case as REVIEWED")
    void testSubmitDoctorReview_Success() throws Exception {
        PatientCase pc = createAndSaveSubmittedCase("Deepak Verma", SeverityLevel.MODERATE, false, List.of("joint_pain"), "5 days");

        SubmitDoctorReviewRequest request = new SubmitDoctorReviewRequest(
                ReviewStatus.REVIEWED,
                "Patient presenting with joint pain. Prescribed rest and paracetamol. No critical flags observed.",
                "Maintain hydration and return if swelling develops.",
                false
        );

        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/review")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVIEWED"))
                .andExpect(jsonPath("$.doctorNotes").isNotEmpty())
                .andExpect(jsonPath("$.reviewedByDoctorId").value(doctor1.getId()))
                .andExpect(jsonPath("$.reviewedByDoctorName").value(doctor1.getFullName()))
                .andExpect(jsonPath("$.reviewedAt").exists())
                .andExpect(jsonPath("$.followUpRequired").value(false));

        // Verify underlying case transitioned to REVIEWED
        PatientCase updated = patientCaseRepository.findById(pc.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(CaseStatus.REVIEWED);
        assertThat(updated.getIntakeToken().getStatus()).contains("Dr. Priya Patel");
    }

    @Test
    @DisplayName("Doctor can submit review with REQUIRES_FOLLOWUP")
    void testSubmitDoctorReview_RequiresFollowUp() throws Exception {
        PatientCase pc = createAndSaveSubmittedCase("Geeta Rao", SeverityLevel.SEVERE, false, List.of("dizziness"), "1 week");

        SubmitDoctorReviewRequest request = new SubmitDoctorReviewRequest(
                ReviewStatus.REQUIRES_FOLLOWUP,
                "Patient requires blood pressure monitoring and neurological examination.",
                "Schedule in-person clinic visit within 48 hours.",
                true
        );

        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/review")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REQUIRES_FOLLOWUP"))
                .andExpect(jsonPath("$.followUpRequired").value(true));
    }

    @Test
    @DisplayName("Review submission without doctor notes when marking REVIEWED fails validation (400 Bad Request)")
    void testSubmitDoctorReview_MissingNotesFails() throws Exception {
        PatientCase pc = createAndSaveSubmittedCase("Incomplete Case", SeverityLevel.MODERATE, false, List.of("cough"), "2 days");

        SubmitDoctorReviewRequest request = new SubmitDoctorReviewRequest(
                ReviewStatus.REVIEWED,
                "", // empty doctor notes
                "Rest",
                false
        );

        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/review")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Cannot review a case that is still in DRAFT status (400 Bad Request)")
    void testCannotReviewDraftCase() throws Exception {
        PatientCase draftCase = new PatientCase("Draft Patient", "hi", SeverityLevel.MILD);
        draftCase.setPatient(patient);
        draftCase.setStatus(CaseStatus.DRAFT);
        PatientCase saved = patientCaseRepository.save(draftCase);

        SubmitDoctorReviewRequest request = new SubmitDoctorReviewRequest(
                ReviewStatus.REVIEWED,
                "Premature review",
                "None",
                false
        );

        mockMvc.perform(post("/api/v1/doctor/cases/" + saved.getId() + "/review")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot review a case that is still in draft status."));
    }

    @Test
    @DisplayName("Doctor overwrite protection: Doctor 2 cannot overwrite Doctor 1's completed review (403 Forbidden)")
    void testDoctorCannotOverwriteAnotherDoctorReview() throws Exception {
        PatientCase pc = createAndSaveSubmittedCase("Locked Case", SeverityLevel.MODERATE, false, List.of("fever"), "2 days");

        // Doctor 1 completes review
        SubmitDoctorReviewRequest dr1Request = new SubmitDoctorReviewRequest(
                ReviewStatus.REVIEWED,
                "Review completed by Dr. Priya Patel.",
                "Follow standard instructions.",
                false
        );
        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/review")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dr1Request)))
                .andExpect(status().isOk());

        // Doctor 2 attempts to overwrite Doctor 1's review
        SubmitDoctorReviewRequest dr2Request = new SubmitDoctorReviewRequest(
                ReviewStatus.REVIEWED,
                "Unauthorized overwrite attempt by Dr. Vikram.",
                "Override",
                false
        );
        mockMvc.perform(put("/api/v1/doctor/cases/" + pc.getId() + "/review")
                        .header("Authorization", "Bearer " + doctor2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dr2Request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Only the original reviewing doctor or an administrator can modify it.")));
    }

    @Test
    @DisplayName("Administrator can override an existing review completed by another doctor")
    void testAdminCanOverrideDoctorReview() throws Exception {
        PatientCase pc = createAndSaveSubmittedCase("Admin Oversight Case", SeverityLevel.MODERATE, false, List.of("backache"), "3 days");

        // Doctor 1 reviews
        SubmitDoctorReviewRequest dr1Request = new SubmitDoctorReviewRequest(
                ReviewStatus.REVIEWED,
                "Initial review by Dr. Priya.",
                "Rest",
                false
        );
        mockMvc.perform(post("/api/v1/doctor/cases/" + pc.getId() + "/review")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dr1Request)))
                .andExpect(status().isOk());

        // Admin overrides review via admin endpoint
        SubmitDoctorReviewRequest adminOverrideRequest = new SubmitDoctorReviewRequest(
                ReviewStatus.REQUIRES_FOLLOWUP,
                "Supervisor review: Follow-up required for MRI scan.",
                "Recommend neurological referral.",
                true
        );
        mockMvc.perform(put("/api/v1/admin/cases/" + pc.getId() + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminOverrideRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REQUIRES_FOLLOWUP"))
                .andExpect(jsonPath("$.reviewedByDoctorName").value(admin.getFullName()));
    }

    @Test
    @DisplayName("Doctor can retrieve real-time triage queue statistics")
    void testGetTriageStats_Success() throws Exception {
        mockMvc.perform(get("/api/v1/doctor/triage/stats")
                        .header("Authorization", "Bearer " + doctor1Token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSubmitted").isNumber())
                .andExpect(jsonPath("$.pendingReview").isNumber())
                .andExpect(jsonPath("$.urgentCases").isNumber())
                .andExpect(jsonPath("$.reviewedCases").isNumber())
                .andExpect(jsonPath("$.requiresFollowup").isNumber());
    }
}
