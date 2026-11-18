package com.mediconnect.repository;

import com.mediconnect.entity.CaseAnswer;
import com.mediconnect.entity.DoctorReview;
import com.mediconnect.entity.GeneratedCaseReport;
import com.mediconnect.entity.IntakeToken;
import com.mediconnect.entity.MedicalHistory;
import com.mediconnect.entity.MedicalReport;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.PatientProfile;
import com.mediconnect.entity.Role;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.ReviewStatus;
import com.mediconnect.entity.enums.RoleType;
import com.mediconnect.entity.enums.SeverityLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class EntityMappingPersistenceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private PatientCaseRepository patientCaseRepository;

    @Autowired
    private IntakeTokenRepository intakeTokenRepository;

    @Autowired
    private DoctorReviewRepository doctorReviewRepository;

    @Autowired
    private MedicalReportRepository medicalReportRepository;

    private Role patientRole;
    private Role doctorRole;

    @BeforeEach
    void setUp() {
        patientRole = roleRepository.save(new Role(RoleType.PATIENT, "Patient role"));
        doctorRole = roleRepository.save(new Role(RoleType.DOCTOR, "Doctor role"));
        roleRepository.save(new Role(RoleType.ADMIN, "Admin role"));
    }

    @Test
    @DisplayName("Should persist and retrieve Role entities by enum RoleType")
    void shouldPersistAndRetrieveRoles() {
        Optional<Role> found = roleRepository.findByName(RoleType.PATIENT);
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo(RoleType.PATIENT);

        assertThat(roleRepository.existsByName(RoleType.DOCTOR)).isTrue();
        assertThat(roleRepository.existsByName(RoleType.ADMIN)).isTrue();
    }

    @Test
    @DisplayName("Should persist User and associate with Role and PatientProfile")
    void shouldPersistUserWithProfile() {
        User user = new User("sunita.devi@example.com", "$2a$10$hashedPasswordHere", "Sunita Devi", patientRole);
        user.setPhone("+91 98765 01234");

        PatientProfile profile = new PatientProfile();
        profile.setAge(45);
        profile.setGender("Female");
        profile.setPreferredLanguage("hi");
        profile.setAddress("Varanasi, Uttar Pradesh");
        user.setPatientProfile(profile);

        User savedUser = userRepository.save(user);
        entityManager.flush();
        entityManager.clear();

        Optional<User> retrieved = userRepository.findByEmail("sunita.devi@example.com");
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getFullName()).isEqualTo("Sunita Devi");
        assertThat(retrieved.get().getRole().getName()).isEqualTo(RoleType.PATIENT);
        assertThat(retrieved.get().getPatientProfile()).isNotNull();
        assertThat(retrieved.get().getPatientProfile().getAge()).isEqualTo(45);
        assertThat(retrieved.get().getPatientProfile().getPreferredLanguage()).isEqualTo("hi");
    }

    @Test
    @DisplayName("Should persist complete PatientCase with answers, token, history, reports, and AI summary")
    void shouldPersistCompletePatientCaseHierarchy() {
        // 1. Create Patient User & Doctor User
        User patientUser = userRepository.save(new User("patient1@example.com", "hash1", "Ramesh Sharma", patientRole));
        User doctorUser = userRepository.save(new User("doctor1@example.com", "hash2", "Dr. Anita Desai", doctorRole));

        // 2. Create PatientCase
        PatientCase patientCase = new PatientCase("Ramesh Sharma", "hi", SeverityLevel.SEVERE);
        patientCase.setPatient(patientUser);
        patientCase.setPatientAge(52);
        patientCase.setPatientGender("Male");
        patientCase.setPatientPhone("+91 98765 43210");
        patientCase.setDuration("4 days");
        patientCase.setIsEmergencyFlagged(false);
        patientCase.setStatus(com.mediconnect.entity.enums.CaseStatus.SUBMITTED);
        patientCase.setPrimarySymptoms(List.of("fever", "joint_body_pain"));

        // 3. Add Questionnaire Answer
        CaseAnswer answer1 = new CaseAnswer("fever_duration", "How long has fever lasted?", "4_7_days", false);
        CaseAnswer answer2 = new CaseAnswer("fever_temperature", "Highest temperature recorded?", "high_101_103", true);
        patientCase.addSymptomAnswer(answer1);
        patientCase.addSymptomAnswer(answer2);

        // 4. Add Intake Token
        IntakeToken token = new IntakeToken("MC-20261023-0101", LocalDateTime.now(), "Submitted — Awaiting Doctor Review");
        token.setDepartment("General Medicine & Triage");
        token.setDayOfWeek("Friday");
        token.setFormattedDate("23 October 2026");
        token.setFormattedTime("06:40 PM");
        token.setLocale("hi-IN");
        token.setUploadedReportCount(1);
        patientCase.setIntakeToken(token);

        // 5. Add Medical History
        MedicalHistory history = new MedicalHistory(
                "[\"Type 2 Diabetes\", \"Hypertension\"]",
                "Metformin 500mg, Telmisartan 40mg",
                "NKDA",
                true
        );
        history.setPastSurgeries("Appendectomy (2012)");
        history.setFamilyHistory("Father had diabetes");
        patientCase.setMedicalHistory(history);

        // 6. Add Medical Report metadata (no raw bytes, only reference)
        MedicalReport report = new MedicalReport(
                "CBC_Blood_Test.pdf",
                1420000L,
                "application/pdf",
                "cases/case-demo-101/cbc.pdf",
                false
        );
        report.setUploadDate("2026-10-22");
        patientCase.addUploadedReport(report);

        // 7. Add AI Generated Case Report
        GeneratedCaseReport genReport = new GeneratedCaseReport(
                "High-grade fever with chills and joint pain for 4 days",
                "Patient reports onset of high fever worsening in evenings with shivering chills...",
                LocalDateTime.now()
        );
        genReport.setSelectedLanguage("Hindi (हिन्दी)");
        genReport.setModelName("gemini-1.5-pro");
        genReport.setIsDemoGenerated(true);
        patientCase.setGeneratedReport(genReport);

        // 8. Add Doctor Review
        DoctorReview review = new DoctorReview(ReviewStatus.PENDING_REVIEW, "Awaiting triage inspection", false);
        review.setReviewedByDoctor(doctorUser);
        patientCase.setDoctorReview(review);

        // Save entire aggregate
        PatientCase savedCase = patientCaseRepository.save(patientCase);
        entityManager.flush();
        entityManager.clear();

        // Verify retrieval by case ID
        Optional<PatientCase> retrievedCase = patientCaseRepository.findById(savedCase.getId());
        assertThat(retrievedCase).isPresent();
        PatientCase c = retrievedCase.get();
        assertThat(c.getPatientName()).isEqualTo("Ramesh Sharma");
        assertThat(c.getSeverity()).isEqualTo(SeverityLevel.SEVERE);
        assertThat(c.getPrimarySymptoms()).containsExactlyInAnyOrder("fever", "joint_body_pain");

        // Verify child relationships
        assertThat(c.getSymptomAnswers()).hasSize(2);
        assertThat(c.getUploadedReports()).hasSize(1);
        assertThat(c.getUploadedReports().get(0).getName()).isEqualTo("CBC_Blood_Test.pdf");
        assertThat(c.getUploadedReports().get(0).getStorageReference()).isEqualTo("cases/case-demo-101/cbc.pdf");

        assertThat(c.getIntakeToken()).isNotNull();
        assertThat(c.getIntakeToken().getTokenNumber()).isEqualTo("MC-20261023-0101");

        assertThat(c.getMedicalHistory()).isNotNull();
        assertThat(c.getMedicalHistory().getProvided()).isTrue();
        assertThat(c.getMedicalHistory().getConditions()).contains("Type 2 Diabetes");

        assertThat(c.getGeneratedReport()).isNotNull();
        assertThat(c.getGeneratedReport().getChiefComplaint()).contains("High-grade fever");

        assertThat(c.getDoctorReview()).isNotNull();
        assertThat(c.getDoctorReview().getStatus()).isEqualTo(ReviewStatus.PENDING_REVIEW);

        // Verify lookup by token number
        Optional<IntakeToken> retrievedToken = intakeTokenRepository.findByTokenNumber("MC-20261023-0101");
        assertThat(retrievedToken).isPresent();
        assertThat(retrievedToken.get().getPatientCase().getId()).isEqualTo(c.getId());
    }

    @Test
    @DisplayName("Should query emergency flagged cases and doctor review status")
    void shouldQueryEmergencyCasesAndReviewStatus() {
        PatientCase urgentCase = new PatientCase("Emergency Patient", "en", SeverityLevel.SEVERE);
        urgentCase.setIsEmergencyFlagged(true);
        DoctorReview urgentReview = new DoctorReview(ReviewStatus.URGENT, "Requires immediate attention", true);
        urgentCase.setDoctorReview(urgentReview);
        patientCaseRepository.save(urgentCase);

        PatientCase normalCase = new PatientCase("Routine Patient", "hi", SeverityLevel.MILD);
        normalCase.setIsEmergencyFlagged(false);
        DoctorReview normalReview = new DoctorReview(ReviewStatus.REVIEWED, "Prescribed rest", false);
        normalCase.setDoctorReview(normalReview);
        patientCaseRepository.save(normalCase);

        entityManager.flush();
        entityManager.clear();

        List<PatientCase> emergencies = patientCaseRepository.findByIsEmergencyFlagged(true);
        assertThat(emergencies).hasSize(1);
        assertThat(emergencies.get(0).getPatientName()).isEqualTo("Emergency Patient");

        List<DoctorReview> urgentReviews = doctorReviewRepository.findByStatus(ReviewStatus.URGENT);
        assertThat(urgentReviews).hasSize(1);
        assertThat(urgentReviews.get(0).getFollowUpRequired()).isTrue();
    }
}
