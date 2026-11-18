package com.mediconnect.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.entity.MedicalReport;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.Role;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.RoleType;
import com.mediconnect.entity.enums.SeverityLevel;
import com.mediconnect.exception.StorageException;
import com.mediconnect.repository.MedicalReportRepository;
import com.mediconnect.repository.PatientCaseRepository;
import com.mediconnect.repository.RoleRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.security.JwtUtils;
import com.mediconnect.storage.LocalStorageService;
import com.mediconnect.storage.StorageUploadResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MedicalReportIntegrationTest {

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
    private MedicalReportRepository medicalReportRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @MockBean
    private LocalStorageService localStorageService;

    private User patientA;
    private User patientB;
    private User doctor;
    private User admin;

    private String patientAToken;
    private String patientBToken;
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

        patientA = userRepository.findByEmail("report.patient.a@test.com").orElseGet(() -> {
            User p = new User("report.patient.a@test.com", passwordEncoder.encode("Pass@123"), "Patient A", patientRole);
            return userRepository.save(p);
        });

        patientB = userRepository.findByEmail("report.patient.b@test.com").orElseGet(() -> {
            User p = new User("report.patient.b@test.com", passwordEncoder.encode("Pass@123"), "Patient B", patientRole);
            return userRepository.save(p);
        });

        doctor = userRepository.findByEmail("report.doc@test.com").orElseGet(() -> {
            User d = new User("report.doc@test.com", passwordEncoder.encode("Pass@123"), "Dr. Diagnostic", doctorRole);
            return userRepository.save(d);
        });

        admin = userRepository.findByEmail("report.admin@test.com").orElseGet(() -> {
            User a = new User("report.admin@test.com", passwordEncoder.encode("Pass@123"), "Admin Clinical Ops", adminRole);
            return userRepository.save(a);
        });

        patientAToken = jwtUtils.generateTokenFromUser(patientA);
        patientBToken = jwtUtils.generateTokenFromUser(patientB);
        doctorToken = jwtUtils.generateTokenFromUser(doctor);
        adminToken = jwtUtils.generateTokenFromUser(admin);
    }

    private PatientCase createDraftCase(User patient) {
        PatientCase pc = new PatientCase(patient.getFullName(), "hi", SeverityLevel.MODERATE);
        pc.setPatient(patient);
        pc.setStatus(CaseStatus.DRAFT);
        pc.setPrimarySymptoms(new ArrayList<>(List.of("cough")));
        pc.setDuration("3 days");
        return patientCaseRepository.save(pc);
    }

    private PatientCase createSubmittedCase(User patient) {
        PatientCase pc = new PatientCase(patient.getFullName(), "hi", SeverityLevel.SEVERE);
        pc.setPatient(patient);
        pc.setStatus(CaseStatus.SUBMITTED);
        pc.setPrimarySymptoms(new ArrayList<>(List.of("fever")));
        pc.setDuration("5 days");
        return patientCaseRepository.save(pc);
    }

    private MockMultipartFile createValidPdfFile() {
        byte[] pdfContent = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34}; // %PDF-1.4
        return new MockMultipartFile("file", "lab_test_cbc.pdf", "application/pdf", pdfContent);
    }

    @Test
    @DisplayName("Patient can successfully upload a valid medical PDF document to a draft case")
    void testUploadReport_Success() throws Exception {
        PatientCase pc = createDraftCase(patientA);
        MockMultipartFile file = createValidPdfFile();

        when(localStorageService.storeFile(anyString(), any(byte[].class), anyString()))
                .thenReturn(new StorageUploadResult("cases/" + pc.getId() + "/lab_test_cbc.pdf", file.getSize(), "application/pdf"));

        mockMvc.perform(multipart("/api/v1/patient/cases/" + pc.getId() + "/reports")
                        .file(file)
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("lab_test_cbc.pdf"))
                .andExpect(jsonPath("$.size").value(file.getSize()))
                .andExpect(jsonPath("$.type").value("application/pdf"))
                .andExpect(jsonPath("$.isImage").value(false))
                .andExpect(jsonPath("$.storageReference").value("cases/" + pc.getId() + "/lab_test_cbc.pdf"));

        // Verify MySQL database record
        List<MedicalReport> savedReports = medicalReportRepository.findByPatientCaseId(pc.getId());
        assertThat(savedReports).hasSize(1);
        assertThat(savedReports.get(0).getName()).isEqualTo("lab_test_cbc.pdf");
    }

    @Test
    @DisplayName("Upload fails when file has invalid extension or signature (400 Bad Request)")
    void testUploadReport_InvalidFileType_Rejected() throws Exception {
        PatientCase pc = createDraftCase(patientA);
        MockMultipartFile maliciousFile = new MockMultipartFile(
                "file", "malware.exe", "application/octet-stream", new byte[]{0x4D, 0x5A, 0x00});

        mockMvc.perform(multipart("/api/v1/patient/cases/" + pc.getId() + "/reports")
                        .file(maliciousFile)
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Unsupported file extension")));
    }

    @Test
    @DisplayName("Attempting to upload a document to a submitted case returns 400 Bad Request")
    void testUploadReport_OnSubmittedCase_Rejected() throws Exception {
        PatientCase submittedCase = createSubmittedCase(patientA);
        MockMultipartFile file = createValidPdfFile();

        mockMvc.perform(multipart("/api/v1/patient/cases/" + submittedCase.getId() + "/reports")
                        .file(file)
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot modify or delete reports for a case that has already been submitted."));
    }

    @Test
    @DisplayName("Cross-patient access prevention: Patient B cannot access Patient A's reports (403 Forbidden)")
    void testCrossPatientAccess_Forbidden() throws Exception {
        PatientCase caseA = createDraftCase(patientA);

        // Upload report for patient A
        MedicalReport report = new MedicalReport("xray.png", 2048L, "image/png", "cases/" + caseA.getId() + "/xray.png", true);
        report.setPatientCase(caseA);
        medicalReportRepository.save(report);

        // Patient B attempts to list patient A's reports
        mockMvc.perform(get("/api/v1/patient/cases/" + caseA.getId() + "/reports")
                        .header("Authorization", "Bearer " + patientBToken))
                .andExpect(status().isForbidden());

        // Patient B attempts to get signed URL
        mockMvc.perform(get("/api/v1/patient/cases/" + caseA.getId() + "/reports/" + report.getId() + "/signed-url")
                        .header("Authorization", "Bearer " + patientBToken))
                .andExpect(status().isForbidden());

        // Patient B attempts to delete patient A's report
        mockMvc.perform(delete("/api/v1/patient/cases/" + caseA.getId() + "/reports/" + report.getId())
                        .header("Authorization", "Bearer " + patientBToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request to reports returns 401 Unauthorized")
    void testUnauthenticatedAccess_Returns401() throws Exception {
        PatientCase pc = createDraftCase(patientA);

        mockMvc.perform(get("/api/v1/patient/cases/" + pc.getId() + "/reports"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Patient can generate a short-lived signed URL for their uploaded document")
    void testGetReportSignedUrl_AsPatient_Success() throws Exception {
        PatientCase pc = createDraftCase(patientA);
        MedicalReport report = new MedicalReport("prescription.pdf", 4096L, "application/pdf", "cases/" + pc.getId() + "/prescription.pdf", false);
        report.setPatientCase(pc);
        medicalReportRepository.save(report);

        mockMvc.perform(get("/api/v1/patient/cases/" + pc.getId() + "/reports/" + report.getId() + "/signed-url")
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportId").value(report.getId()))
                .andExpect(jsonPath("$.fileName").value("prescription.pdf"))
                .andExpect(jsonPath("$.signedUrl").value(org.hamcrest.Matchers.containsString("/reports/" + report.getId() + "/view?token=")))
                .andExpect(jsonPath("$.expiresInSeconds").value(300));
    }

    @Test
    @DisplayName("Patient can securely download document binary streamed directly from backend")
    void testDownloadReport_AsPatient_Success() throws Exception {
        PatientCase pc = createDraftCase(patientA);
        MedicalReport report = new MedicalReport("document.pdf", 4L, "application/pdf", "cases/" + pc.getId() + "/document.pdf", false);
        report.setPatientCase(pc);
        medicalReportRepository.save(report);

        byte[] expectedBytes = new byte[]{0x25, 0x50, 0x44, 0x46};
        when(localStorageService.loadFile("cases/" + pc.getId() + "/document.pdf"))
                .thenReturn(expectedBytes);

        mockMvc.perform(get("/api/v1/patient/cases/" + pc.getId() + "/reports/" + report.getId() + "/download")
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("document.pdf")))
                .andExpect(content().bytes(expectedBytes));
    }

    @Test
    @DisplayName("Doctor can access documents on a submitted case")
    void testDoctorCanAccessReports_OnSubmittedCase() throws Exception {
        PatientCase pc = createSubmittedCase(patientA);
        MedicalReport report = new MedicalReport("ct_scan.jpg", 1024L, "image/jpeg", "cases/" + pc.getId() + "/ct_scan.jpg", true);
        report.setPatientCase(pc);
        medicalReportRepository.save(report);

        mockMvc.perform(get("/api/v1/doctor/cases/" + pc.getId() + "/reports")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("ct_scan.jpg"));
    }

    @Test
    @DisplayName("Doctor cannot access documents of an unsubmitted draft case (400 Bad Request)")
    void testDoctorCannotAccessReports_OnDraftCase() throws Exception {
        PatientCase draftCase = createDraftCase(patientA);

        mockMvc.perform(get("/api/v1/doctor/cases/" + draftCase.getId() + "/reports")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Medical staff cannot view documents of an unsubmitted draft case."));
    }

    @Test
    @DisplayName("Doctors are not permitted to delete patient medical reports (403 Forbidden)")
    void testDoctorCannotDeletePatientReports() throws Exception {
        PatientCase pc = createSubmittedCase(patientA);
        MedicalReport report = new MedicalReport("record.pdf", 1024L, "application/pdf", "cases/" + pc.getId() + "/record.pdf", false);
        report.setPatientCase(pc);
        medicalReportRepository.save(report);

        mockMvc.perform(delete("/api/v1/doctor/cases/" + pc.getId() + "/reports/" + report.getId())
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Access Denied"));
    }

    @Test
    @DisplayName("Administrator can delete medical reports from submitted cases")
    void testAdminCanDeleteReport() throws Exception {
        PatientCase pc = createSubmittedCase(patientA);
        MedicalReport report = new MedicalReport("admin_purge.pdf", 1024L, "application/pdf", "cases/" + pc.getId() + "/admin_purge.pdf", false);
        report.setPatientCase(pc);
        medicalReportRepository.save(report);

        mockMvc.perform(delete("/api/v1/doctor/cases/" + pc.getId() + "/reports/" + report.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Medical report successfully deleted by administrator."));

        verify(localStorageService).deleteFile("cases/" + pc.getId() + "/admin_purge.pdf");
        assertThat(medicalReportRepository.findById(report.getId())).isEmpty();
    }

    @Test
    @DisplayName("Patient can delete their own report from a draft case")
    void testDeleteReport_AsPatient_Success() throws Exception {
        PatientCase pc = createDraftCase(patientA);
        MedicalReport report = new MedicalReport("delete_me.pdf", 1024L, "application/pdf", "cases/" + pc.getId() + "/delete_me.pdf", false);
        report.setPatientCase(pc);
        medicalReportRepository.save(report);

        mockMvc.perform(delete("/api/v1/patient/cases/" + pc.getId() + "/reports/" + report.getId())
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Medical report successfully deleted."));

        verify(localStorageService).deleteFile("cases/" + pc.getId() + "/delete_me.pdf");
        assertThat(medicalReportRepository.findById(report.getId())).isEmpty();
    }

    @Test
    @DisplayName("Returns 500 Internal Server Error when Local Storage provider fails")
    void testUploadReport_ProviderFailure_Returns500() throws Exception {
        PatientCase pc = createDraftCase(patientA);
        MockMultipartFile file = createValidPdfFile();

        when(localStorageService.storeFile(anyString(), any(byte[].class), anyString()))
                .thenThrow(new StorageException("Storage disk full or I/O failure."));

        mockMvc.perform(multipart("/api/v1/patient/cases/" + pc.getId() + "/reports")
                        .file(file)
                        .header("Authorization", "Bearer " + patientAToken))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Storage Error"))
                .andExpect(jsonPath("$.message").value("Storage disk full or I/O failure."));
    }
}
