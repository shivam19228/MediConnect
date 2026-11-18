package com.mediconnect.service;

import com.mediconnect.dto.response.DownloadedDocument;
import com.mediconnect.dto.response.MedicalReportResponse;
import com.mediconnect.dto.response.SignedUrlResponse;
import com.mediconnect.entity.MedicalReport;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.exception.InvalidFileException;
import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.repository.MedicalReportRepository;
import com.mediconnect.repository.PatientCaseRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.security.JwtUtils;
import com.mediconnect.storage.LocalStorageService;
import com.mediconnect.storage.StorageUploadResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Service managing secure patient medical report upload, retrieval, signed URL generation,
 * and deletion using local medical document storage.
 */
@Service
@Transactional
public class MedicalReportService {

    private static final Logger log = LoggerFactory.getLogger(MedicalReportService.class);

    private final PatientCaseRepository patientCaseRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final UserRepository userRepository;
    private final FileValidationService fileValidationService;
    private final LocalStorageService localStorageService;
    private final JwtUtils jwtUtils;

    public MedicalReportService(
            PatientCaseRepository patientCaseRepository,
            MedicalReportRepository medicalReportRepository,
            UserRepository userRepository,
            FileValidationService fileValidationService,
            LocalStorageService localStorageService,
            JwtUtils jwtUtils) {
        this.patientCaseRepository = patientCaseRepository;
        this.medicalReportRepository = medicalReportRepository;
        this.userRepository = userRepository;
        this.fileValidationService = fileValidationService;
        this.localStorageService = localStorageService;
        this.jwtUtils = jwtUtils;
    }

    /**
     * Uploads a medical document to local storage and records metadata in MySQL.
     * Enforces case ownership, draft status, file validation, and compensating rollback on failure.
     */
    public MedicalReportResponse uploadReport(String caseId, MultipartFile file, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyPatientCaseOwnership(patientCase, authentication);
        verifyCaseIsDraft(patientCase);

        fileValidationService.validateFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = fileValidationService.extractExtension(originalFilename);
        boolean isImage = fileValidationService.isImage(file.getContentType(), extension);
        String storagePath = fileValidationService.generateStoragePath(caseId, originalFilename);
        String normalizedContentType = fileValidationService.normalizeContentType(file.getContentType(), extension);

        byte[] contentBytes;
        try {
            contentBytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidFileException("Failed to read file content: " + e.getMessage());
        }

        // 1. Upload to Local Storage
        StorageUploadResult uploadResult = localStorageService.storeFile(
                storagePath, contentBytes, normalizedContentType);

        // 2. Persist metadata to MySQL with compensating cleanup if database persistence fails
        try {
            MedicalReport report = new MedicalReport();
            report.setPatientCase(patientCase);
            report.setName(originalFilename);
            report.setSize(file.getSize());
            report.setType(normalizedContentType);
            report.setStorageReference(uploadResult.getStorageReference());
            report.setIsImage(isImage);
            report.setUploadDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH)));

            patientCase.addUploadedReport(report);
            if (patientCase.getIntakeToken() != null) {
                patientCase.getIntakeToken().setUploadedReportCount(patientCase.getUploadedReports().size());
            }

            MedicalReport saved = medicalReportRepository.save(report);
            log.info("Successfully persisted medical report metadata [id={}] for case [id={}]", saved.getId(), caseId);

            return MedicalReportResponse.fromEntity(saved);

        } catch (Exception ex) {
            log.error("Database save failed after local storage upload for path [{}]; initiating compensation deletion: {}",
                    storagePath, ex.getMessage());
            localStorageService.deleteFile(storagePath);
            throw ex;
        }
    }

    /**
     * Retrieves all documents associated with an authorized patient case.
     */
    @Transactional(readOnly = true)
    public List<MedicalReportResponse> getCaseReports(String caseId, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseAccess(patientCase, authentication);

        List<MedicalReport> reports = medicalReportRepository.findByPatientCaseIdOrderByCreatedAtDesc(caseId);
        return reports.stream().map(MedicalReportResponse::fromEntity).toList();
    }

    /**
     * Retrieves metadata for a single document.
     */
    @Transactional(readOnly = true)
    public MedicalReportResponse getReportMetadata(String caseId, String reportId, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseAccess(patientCase, authentication);

        MedicalReport report = medicalReportRepository.findByIdAndPatientCaseId(reportId, caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical report not found with id: " + reportId + " for case: " + caseId));

        return MedicalReportResponse.fromEntity(report);
    }

    /**
     * Generates a short-lived signed URL for authorized viewing/download directly through Spring Boot.
     */
    @Transactional(readOnly = true)
    public SignedUrlResponse generateSignedUrl(String caseId, String reportId, int expiresInSeconds, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseAccess(patientCase, authentication);

        MedicalReport report = medicalReportRepository.findByIdAndPatientCaseId(reportId, caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical report not found with id: " + reportId + " for case: " + caseId));

        if (expiresInSeconds <= 0 || expiresInSeconds > 3600) {
            expiresInSeconds = 300; // default 5 minutes
        }

        String shortLivedToken = jwtUtils.generateShortLivedToken(authentication, expiresInSeconds * 1000L);
        String rolePrefix = hasRole(authentication, "ROLE_PATIENT") ? "patient" : "doctor";
        String pathWithoutQuery = String.format("/api/v1/%s/cases/%s/reports/%s/view",
                rolePrefix, caseId, reportId);

        String fullSignedUrl;
        try {
            fullSignedUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(pathWithoutQuery)
                    .queryParam("token", shortLivedToken)
                    .build()
                    .toUriString();
        } catch (Exception e) {
            fullSignedUrl = pathWithoutQuery + "?token=" + shortLivedToken;
        }

        return new SignedUrlResponse(report.getId(), report.getName(), report.getType(), fullSignedUrl, expiresInSeconds);
    }

    /**
     * Downloads document content securely, streamed directly from local storage.
     */
    @Transactional(readOnly = true)
    public DownloadedDocument downloadDocument(String caseId, String reportId, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseAccess(patientCase, authentication);

        MedicalReport report = medicalReportRepository.findByIdAndPatientCaseId(reportId, caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical report not found with id: " + reportId + " for case: " + caseId));

        byte[] data = localStorageService.loadFile(report.getStorageReference());
        return new DownloadedDocument(report.getName(), report.getType(), data);
    }

    /**
     * Deletes a medical document from both database and local storage.
     * Enforces that patients can only delete reports while the case is in DRAFT status.
     * Admins can delete reports from any case. Doctors cannot delete patient medical records.
     */
    public void deleteReport(String caseId, String reportId, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        MedicalReport report = medicalReportRepository.findByIdAndPatientCaseId(reportId, caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical report not found with id: " + reportId + " for case: " + caseId));

        boolean isAdmin = hasRole(authentication, "ROLE_ADMIN");
        boolean isDoctor = hasRole(authentication, "ROLE_DOCTOR");
        boolean isPatient = hasRole(authentication, "ROLE_PATIENT");

        if (isPatient) {
            verifyPatientCaseOwnership(patientCase, authentication);
            verifyCaseIsDraft(patientCase);
        } else if (isDoctor && !isAdmin) {
            throw new AccessDeniedException("Doctors are not permitted to delete patient medical records.");
        } else if (!isAdmin) {
            throw new AccessDeniedException("Unauthorized to delete medical records.");
        }

        // 1. Delete from database
        String storageReference = report.getStorageReference();
        patientCase.removeUploadedReport(report);
        if (patientCase.getIntakeToken() != null) {
            patientCase.getIntakeToken().setUploadedReportCount(patientCase.getUploadedReports().size());
        }
        medicalReportRepository.delete(report);
        patientCaseRepository.save(patientCase);

        // 2. Delete from local storage
        localStorageService.deleteFile(storageReference);
        log.info("Successfully deleted report [id={}] and local storage object [{}]", reportId, storageReference);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BadCredentialsException("User is not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private void verifyPatientCaseOwnership(PatientCase patientCase, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (patientCase.getPatient() == null || !patientCase.getPatient().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: you do not own this patient case.");
        }
    }

    private void verifyCaseAccess(PatientCase patientCase, Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentication required to access medical documents");
        }

        boolean isStaff = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_DOCTOR") || role.equals("ROLE_ADMIN"));

        if (isStaff) {
            if (patientCase.getStatus() == CaseStatus.DRAFT) {
                throw new IllegalStateException("Medical staff cannot view documents of an unsubmitted draft case.");
            }
            return;
        }

        // Patient access check
        verifyPatientCaseOwnership(patientCase, authentication);
    }

    private void verifyCaseIsDraft(PatientCase patientCase) {
        if (patientCase.getStatus() != CaseStatus.DRAFT) {
            throw new IllegalStateException("Cannot modify or delete reports for a case that has already been submitted.");
        }
    }

    private boolean hasRole(Authentication authentication, String roleName) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals(roleName));
    }
}
