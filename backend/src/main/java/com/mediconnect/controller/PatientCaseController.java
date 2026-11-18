package com.mediconnect.controller;

import com.mediconnect.dto.request.CreateCaseDraftRequest;
import com.mediconnect.dto.request.MedicalHistoryDto;
import com.mediconnect.dto.request.SaveCaseAnswersRequest;
import com.mediconnect.dto.request.UpdateCaseDraftRequest;
import com.mediconnect.dto.response.CaseDetailResponse;
import com.mediconnect.dto.response.CaseSummaryResponse;
import com.mediconnect.dto.response.GeneratedReportSummaryDto;
import com.mediconnect.dto.response.SubmitCaseResponse;
import com.mediconnect.service.AiReportService;
import com.mediconnect.service.PatientCaseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PatientCaseController {

    private final PatientCaseService patientCaseService;
    private final AiReportService aiReportService;

    public PatientCaseController(PatientCaseService patientCaseService, AiReportService aiReportService) {
        this.patientCaseService = patientCaseService;
        this.aiReportService = aiReportService;
    }

    @PostMapping("/cases")
    public ResponseEntity<CaseDetailResponse> createCaseDraft(
            @Valid @RequestBody(required = false) CreateCaseDraftRequest request,
            Authentication authentication) {
        CreateCaseDraftRequest safeRequest = request != null ? request : new CreateCaseDraftRequest();
        CaseDetailResponse response = patientCaseService.createCaseDraft(safeRequest, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/cases")
    public ResponseEntity<List<CaseSummaryResponse>> getMyCases(Authentication authentication) {
        List<CaseSummaryResponse> cases = patientCaseService.getMyCases(authentication);
        return ResponseEntity.ok(cases);
    }

    @GetMapping("/cases/{id}")
    public ResponseEntity<CaseDetailResponse> getCaseById(
            @PathVariable String id, Authentication authentication) {
        CaseDetailResponse response = patientCaseService.getCaseById(id, authentication);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/cases/{id}")
    public ResponseEntity<CaseDetailResponse> updateCaseDraft(
            @PathVariable String id,
            @Valid @RequestBody UpdateCaseDraftRequest request,
            Authentication authentication) {
        CaseDetailResponse response = patientCaseService.updateCaseDraft(id, request, authentication);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/cases/{id}/answers")
    public ResponseEntity<CaseDetailResponse> saveCaseAnswers(
            @PathVariable String id,
            @Valid @RequestBody SaveCaseAnswersRequest request,
            Authentication authentication) {
        CaseDetailResponse response = patientCaseService.saveCaseAnswers(id, request, authentication);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/cases/{id}/medical-history")
    public ResponseEntity<MedicalHistoryDto> updateMedicalHistory(
            @PathVariable String id,
            @Valid @RequestBody MedicalHistoryDto request,
            Authentication authentication) {
        MedicalHistoryDto response = patientCaseService.updateMedicalHistory(id, request, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cases/{id}/medical-history")
    public ResponseEntity<MedicalHistoryDto> getMedicalHistory(
            @PathVariable String id, Authentication authentication) {
        MedicalHistoryDto response = patientCaseService.getMedicalHistory(id, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient/medical-history")
    public ResponseEntity<MedicalHistoryDto> getPatientLatestMedicalHistory(Authentication authentication) {
        MedicalHistoryDto response = patientCaseService.getPatientLatestMedicalHistory(authentication);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cases/{id}/submit")
    public ResponseEntity<SubmitCaseResponse> submitCase(
            @PathVariable String id, Authentication authentication) {
        SubmitCaseResponse response = patientCaseService.submitCase(id, authentication);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cases/{id}/generate-report")
    public ResponseEntity<GeneratedReportSummaryDto> generateReport(
            @PathVariable String id,
            Authentication authentication) {
        GeneratedReportSummaryDto response = aiReportService.generateCaseReport(id, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cases/{id}/report")
    public ResponseEntity<GeneratedReportSummaryDto> getReport(
            @PathVariable String id,
            Authentication authentication) {
        GeneratedReportSummaryDto response = aiReportService.getCaseReport(id, authentication);
        return ResponseEntity.ok(response);
    }
}
