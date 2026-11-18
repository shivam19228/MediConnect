package com.mediconnect.service;

import com.mediconnect.client.gemini.GeminiClient;
import com.mediconnect.dto.ai.GeminiPromptContext;
import com.mediconnect.dto.ai.GeminiReportResult;
import com.mediconnect.dto.ai.ProcessedDocumentContent;
import com.mediconnect.dto.ai.StructuredClinicalSummaryDto;
import com.mediconnect.dto.request.CaseAnswerDto;
import com.mediconnect.dto.request.MedicalHistoryDto;
import com.mediconnect.dto.response.GeneratedReportSummaryDto;
import com.mediconnect.entity.GeneratedCaseReport;
import com.mediconnect.entity.MedicalReport;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.exception.GeminiServiceException;
import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.repository.GeneratedCaseReportRepository;
import com.mediconnect.repository.PatientCaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Service managing AI clinical summary generation and lifecycle.
 * Coordinates document processing, privacy sanitization, Gemini API invocation,
 * validated analysis persistence in MySQL, and retrieval.
 */
@Service
@Transactional
public class AiReportService {

    private static final Logger log = LoggerFactory.getLogger(AiReportService.class);

    private final PatientCaseRepository patientCaseRepository;
    private final GeneratedCaseReportRepository generatedCaseReportRepository;
    private final GeminiClient geminiClient;
    private final DocumentProcessingService documentProcessingService;

    public AiReportService(
            PatientCaseRepository patientCaseRepository,
            GeneratedCaseReportRepository generatedCaseReportRepository,
            GeminiClient geminiClient,
            DocumentProcessingService documentProcessingService) {
        this.patientCaseRepository = patientCaseRepository;
        this.generatedCaseReportRepository = generatedCaseReportRepository;
        this.geminiClient = geminiClient;
        this.documentProcessingService = documentProcessingService;
    }

    /**
     * Generates or updates an AI structured intake summary for a submitted patient case.
     * Thoroughly analyzes all attached medical documents and persists validated results in MySQL.
     */
    public GeneratedReportSummaryDto generateCaseReport(String caseId, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseAccess(patientCase, authentication);

        if (patientCase.getStatus() == CaseStatus.DRAFT) {
            throw new IllegalStateException("Cannot generate an AI clinical report for a draft case. Case must be submitted first.");
        }

        GeminiPromptContext promptContext = buildSanitizedContext(patientCase);

        log.info("Invoking Gemini analysis for case id: {} with {} attached document(s)",
                caseId, promptContext.getAttachedDocuments().size());

        GeminiReportResult result = geminiClient.generateClinicalSummary(promptContext);
        StructuredClinicalSummaryDto summary = result.getSummary();

        if (summary == null) {
            throw new GeminiServiceException("Gemini returned null summary for case id: " + caseId);
        }

        // Idempotent upsert: update existing report or create a new one
        GeneratedCaseReport report = patientCase.getGeneratedReport();
        if (report == null) {
            report = new GeneratedCaseReport();
            report.setPatientCase(patientCase);
            patientCase.setGeneratedReport(report);
        }

        report.setSelectedLanguage(patientCase.getLanguage());
        report.setChiefComplaint(summary.getChiefComplaint());
        report.setHistoryOfPresentIllness(summary.getHistoryOfPresentIllness());
        report.setSymptomDurationAndSeverity(summary.getSymptomDurationAndSeverity());
        report.setAssociatedSymptoms(summary.getAssociatedSymptoms());
        report.setRelevantMedicalHistory(summary.getRelevantMedicalHistory());
        report.setCurrentMedicines(summary.getCurrentMedicines());
        report.setKnownAllergies(summary.getKnownAllergies());
        report.setPreviousMedicalReports(summary.getPreviousMedicalReports());
        report.setPatientReportedInformation(summary.getPatientReportedInformation());
        report.setMissingOrUnansweredInformation(summary.getMissingOrUnansweredInfo());
        report.setItemsRequiringDoctorReview(summary.getItemsRequiringDoctorReview());
        report.setIsDemoGenerated(result.isDemoGenerated());
        report.setModelName(result.getModelName());
        report.setPromptTokens(result.getPromptTokens());
        report.setCompletionTokens(result.getCompletionTokens());
        report.setGeneratedAt(LocalDateTime.now());

        PatientCase saved = patientCaseRepository.save(patientCase);
        log.info("Successfully persisted validated AI clinical analysis in MySQL for case id: {}", caseId);

        return GeneratedReportSummaryDto.fromEntity(saved.getGeneratedReport());
    }

    /**
     * Retrieves an existing generated AI report for a case from MySQL.
     */
    @Transactional(readOnly = true)
    public GeneratedReportSummaryDto getCaseReport(String caseId, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseAccess(patientCase, authentication);

        if (patientCase.getGeneratedReport() == null) {
            throw new ResourceNotFoundException("No AI clinical report has been generated for case id: " + caseId);
        }

        return GeneratedReportSummaryDto.fromEntity(patientCase.getGeneratedReport());
    }

    /**
     * Sanitizes case data and extracts document contents into a privacy-safe prompt context.
     * Strips all personally identifiable information (name, phone, email, address).
     */
    private GeminiPromptContext buildSanitizedContext(PatientCase patientCase) {
        List<CaseAnswerDto> answers = Collections.emptyList();
        if (patientCase.getSymptomAnswers() != null) {
            answers = patientCase.getSymptomAnswers().stream()
                    .map(a -> new CaseAnswerDto(a.getQuestionId(), a.getQuestionText(), a.getAnswer(), a.getAudioUsed()))
                    .toList();
        }

        MedicalHistoryDto medicalHistory = null;
        if (patientCase.getMedicalHistory() != null) {
            medicalHistory = MedicalHistoryDto.fromEntity(patientCase.getMedicalHistory());
        }

        List<String> reportNames = new ArrayList<>();
        List<ProcessedDocumentContent> attachedDocs = new ArrayList<>();

        if (patientCase.getUploadedReports() != null) {
            for (MedicalReport rep : patientCase.getUploadedReports()) {
                reportNames.add(rep.getName());
                try {
                    ProcessedDocumentContent processed = documentProcessingService.processDocument(rep);
                    attachedDocs.add(processed);
                } catch (Exception ex) {
                    log.error("Failed to process document content for report id {}: {}", rep.getId(), ex.getMessage());
                    ProcessedDocumentContent fallback = new ProcessedDocumentContent();
                    fallback.setFileName(rep.getName());
                    fallback.setExtractionNote("Failed to extract document: " + ex.getMessage());
                    attachedDocs.add(fallback);
                }
            }
        }

        List<String> symptoms = patientCase.getPrimarySymptoms() != null
                ? new ArrayList<>(patientCase.getPrimarySymptoms())
                : Collections.emptyList();

        return new GeminiPromptContext(
                patientCase.getId(),
                patientCase.getPatientAge(),
                patientCase.getPatientGender(),
                patientCase.getLanguage(),
                symptoms,
                patientCase.getSeverity(),
                patientCase.getDuration(),
                patientCase.getIsEmergencyFlagged(),
                answers,
                medicalHistory,
                reportNames,
                attachedDocs
        );
    }

    private void verifyCaseAccess(PatientCase patientCase, Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentication required to access clinical report generation");
        }
        boolean hasStaffRole = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_DOCTOR") || role.equals("ROLE_ADMIN"));
        if (hasStaffRole) {
            return;
        }

        // Allow patient access if caller is the owner of the case
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.mediconnect.security.UserDetailsImpl userDetails) {
            if (patientCase.getPatient() != null && patientCase.getPatient().getId().equals(userDetails.getId())) {
                return;
            }
        } else if (principal instanceof String email) {
            if (patientCase.getPatient() != null && patientCase.getPatient().getEmail().equalsIgnoreCase(email)) {
                return;
            }
        }
        throw new AccessDeniedException("Access denied: You are not authorized to access this case's AI clinical report");
    }
}
