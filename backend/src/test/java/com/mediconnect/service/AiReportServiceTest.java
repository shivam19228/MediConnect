package com.mediconnect.service;

import com.mediconnect.client.gemini.GeminiClient;
import com.mediconnect.dto.ai.GeminiPromptContext;
import com.mediconnect.dto.ai.GeminiReportResult;
import com.mediconnect.dto.ai.ProcessedDocumentContent;
import com.mediconnect.dto.ai.StructuredClinicalSummaryDto;
import com.mediconnect.dto.response.GeneratedReportSummaryDto;
import com.mediconnect.entity.MedicalReport;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.SeverityLevel;
import com.mediconnect.repository.GeneratedCaseReportRepository;
import com.mediconnect.repository.PatientCaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AiReportServiceTest {

    private final Map<String, PatientCase> caseDatabase = new HashMap<>();
    private final AtomicReference<GeminiPromptContext> lastPromptContext = new AtomicReference<>();
    private GeminiReportResult geminiResultToReturn;
    private ProcessedDocumentContent processedDocToReturn;

    private PatientCaseRepository patientCaseRepository;
    private GeneratedCaseReportRepository generatedCaseReportRepository;
    private GeminiClient geminiClient;
    private DocumentProcessingService documentProcessingService;
    private AiReportService aiReportService;

    private Authentication doctorAuth;
    private PatientCase submittedCase;

    @BeforeEach
    void setUp() {
        caseDatabase.clear();
        lastPromptContext.set(null);

        doctorAuth = new UsernamePasswordAuthenticationToken(
                "doctor@mediconnect.com",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_DOCTOR"))
        );

        submittedCase = new PatientCase("Test Patient", "en", SeverityLevel.MODERATE);
        submittedCase.setId("case-abc-123");
        submittedCase.setStatus(CaseStatus.SUBMITTED);
        submittedCase.setPrimarySymptoms(List.of("Cough", "Fever"));
        caseDatabase.put(submittedCase.getId(), submittedCase);

        patientCaseRepository = (PatientCaseRepository) Proxy.newProxyInstance(
                PatientCaseRepository.class.getClassLoader(),
                new Class<?>[]{PatientCaseRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        return Optional.ofNullable(caseDatabase.get(args[0]));
                    }
                    if ("save".equals(method.getName())) {
                        PatientCase pc = (PatientCase) args[0];
                        caseDatabase.put(pc.getId(), pc);
                        return pc;
                    }
                    return null;
                }
        );

        generatedCaseReportRepository = (GeneratedCaseReportRepository) Proxy.newProxyInstance(
                GeneratedCaseReportRepository.class.getClassLoader(),
                new Class<?>[]{GeneratedCaseReportRepository.class},
                (proxy, method, args) -> null
        );

        geminiClient = new GeminiClient() {
            @Override
            public GeminiReportResult generateClinicalSummary(GeminiPromptContext context) {
                lastPromptContext.set(context);
                return geminiResultToReturn;
            }
        };

        documentProcessingService = new DocumentProcessingService(null) {
            @Override
            public ProcessedDocumentContent processDocument(MedicalReport report) {
                return processedDocToReturn;
            }
        };

        aiReportService = new AiReportService(
                patientCaseRepository,
                generatedCaseReportRepository,
                geminiClient,
                documentProcessingService
        );
    }

    @Test
    void generateCaseReport_withAttachedDocument_processesContentAndPersistsAnalysis() {
        MedicalReport report = new MedicalReport("lab_report.pdf", 1024L, "application/pdf", "cases/case-abc-123/lab.pdf", false);
        submittedCase.addUploadedReport(report);

        processedDocToReturn = new ProcessedDocumentContent(
                "lab_report.pdf", "application/pdf",
                "Platelet count: 90,000 /mcL (Reference: 150,000-450,000). Dengue NS1: Positive.",
                new byte[]{10, 20, 30},
                false, false, true, "1 page parsed."
        );

        StructuredClinicalSummaryDto summary = new StructuredClinicalSummaryDto();
        summary.setChiefComplaint("Patient presents with fever and cough for 4 days.");
        summary.setHistoryOfPresentIllness("Acute febrile illness with thrombocytopenia.");
        summary.setPreviousMedicalReports("lab_report.pdf: [ABNORMAL: Platelet count 90,000 /mcL (Ref: 150,000-450,000)]. Dengue NS1 antigen Positive.");
        summary.setItemsRequiringDoctorReview("Urgent clinician review: Monitor for signs of severe dengue hemorrhagic fever.");
        summary.setMissingOrUnansweredInfo("Hematocrit and baseline blood pressure not reported.");

        geminiResultToReturn = new GeminiReportResult(
                summary, "gemini-1.5-flash", 450, 180, 630, false
        );

        GeneratedReportSummaryDto result = aiReportService.generateCaseReport("case-abc-123", doctorAuth);

        assertThat(result).isNotNull();
        assertThat(result.getChiefComplaint()).contains("fever and cough");
        assertThat(result.getPreviousMedicalReports()).contains("Platelet count 90,000 /mcL");
        assertThat(result.getPreviousMedicalReports()).contains("Dengue NS1");
        assertThat(result.getIsDemoGenerated()).isFalse();

        // Verify document processing and prompt construction
        GeminiPromptContext captured = lastPromptContext.get();
        assertThat(captured).isNotNull();
        assertThat(captured.getCaseId()).isEqualTo("case-abc-123");
        assertThat(captured.getAttachedDocuments()).hasSize(1);
        assertThat(captured.getAttachedDocuments().get(0).getExtractedText()).contains("Dengue NS1: Positive");

        // Verify saved in MySQL repository
        PatientCase savedCase = caseDatabase.get("case-abc-123");
        assertThat(savedCase).isNotNull();
        assertThat(savedCase.getGeneratedReport()).isNotNull();
        assertThat(savedCase.getGeneratedReport().getPreviousMedicalReports()).contains("Platelet count 90,000");
    }

    @Test
    void generateCaseReport_whenCaseIsDraft_throwsIllegalStateException() {
        submittedCase.setStatus(CaseStatus.DRAFT);

        assertThatThrownBy(() -> aiReportService.generateCaseReport("case-abc-123", doctorAuth))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot generate an AI clinical report for a draft case");
    }

    @Test
    void getCaseReport_whenReportExists_retrievesPersistedAnalysisWithoutCallingGemini() {
        com.mediconnect.entity.GeneratedCaseReport existingReport = new com.mediconnect.entity.GeneratedCaseReport();
        existingReport.setChiefComplaint("Saved Chief Complaint from MySQL");
        existingReport.setPreviousMedicalReports("CBC Report Analysis");
        existingReport.setIsDemoGenerated(false);
        submittedCase.setGeneratedReport(existingReport);

        GeneratedReportSummaryDto result = aiReportService.getCaseReport("case-abc-123", doctorAuth);

        assertThat(result).isNotNull();
        assertThat(result.getChiefComplaint()).isEqualTo("Saved Chief Complaint from MySQL");
        assertThat(result.getPreviousMedicalReports()).isEqualTo("CBC Report Analysis");
        assertThat(result.getIsDemoGenerated()).isFalse();
    }
}


