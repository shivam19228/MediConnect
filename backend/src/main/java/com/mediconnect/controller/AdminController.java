package com.mediconnect.controller;

import com.mediconnect.dto.request.AssignDoctorRequest;
import com.mediconnect.dto.request.SubmitDoctorReviewRequest;
import com.mediconnect.dto.response.DoctorCaseDetailResponse;
import com.mediconnect.dto.response.DoctorCaseSummaryResponse;
import com.mediconnect.dto.response.DoctorReviewDto;
import com.mediconnect.dto.response.DoctorTriageStatsResponse;
import com.mediconnect.dto.response.GeneratedReportSummaryDto;
import com.mediconnect.dto.response.MedicalReportResponse;
import com.mediconnect.dto.response.PagedResponse;
import com.mediconnect.dto.response.UserSummaryDto;
import com.mediconnect.entity.enums.ReviewStatus;
import com.mediconnect.service.AiReportService;
import com.mediconnect.service.DoctorCaseService;
import com.mediconnect.service.MedicalReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DoctorCaseService doctorCaseService;
    private final AiReportService aiReportService;
    private final MedicalReportService medicalReportService;

    public AdminController(
            DoctorCaseService doctorCaseService,
            AiReportService aiReportService,
            MedicalReportService medicalReportService) {
        this.doctorCaseService = doctorCaseService;
        this.aiReportService = aiReportService;
        this.medicalReportService = medicalReportService;
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getAdminOverview() {
        return ResponseEntity.ok(Map.of(
                "status", "ACTIVE",
                "message", "Admin administrative dashboard is accessible only to users with ROLE_ADMIN"
        ));
    }

    /**
     * Lists registered doctors available for case assignment.
     */
    @GetMapping("/doctors")
    public ResponseEntity<List<UserSummaryDto>> getAvailableDoctors() {
        List<UserSummaryDto> doctors = doctorCaseService.getAvailableDoctors();
        return ResponseEntity.ok(doctors);
    }

    /**
     * Assigns or reassigns an eligible patient case to a registered doctor.
     */
    @PutMapping("/cases/{id}/assign")
    public ResponseEntity<DoctorCaseSummaryResponse> assignDoctor(
            @PathVariable String id,
            @RequestBody @Valid AssignDoctorRequest request,
            Authentication authentication) {
        DoctorCaseSummaryResponse response = doctorCaseService.assignDoctorToCase(id, request.getDoctorId(), authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Lists submitted patient cases for administrative inspection and triage.
     */
    @GetMapping("/cases")
    public ResponseEntity<PagedResponse<DoctorCaseSummaryResponse>> getCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(required = false) Boolean urgentOnly,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "urgent") String sortBy,
            @RequestParam(required = false, defaultValue = "DESC") String sortDirection,
            Authentication authentication) {

        PagedResponse<DoctorCaseSummaryResponse> response = doctorCaseService.getDoctorCases(
                page, size, status, urgentOnly, search, sortBy, sortDirection, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves full clinical details of a patient case for admin supervision.
     */
    @GetMapping("/cases/{id}")
    public ResponseEntity<DoctorCaseDetailResponse> getCaseDetail(
            @PathVariable String id,
            Authentication authentication) {

        DoctorCaseDetailResponse response = doctorCaseService.getDoctorCaseDetail(id, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Submits an administrative or clinical review.
     */
    @PostMapping("/cases/{id}/review")
    public ResponseEntity<DoctorReviewDto> submitReview(
            @PathVariable String id,
            @Valid @RequestBody SubmitDoctorReviewRequest request,
            Authentication authentication) {

        DoctorReviewDto response = doctorCaseService.submitOrUpdateReview(id, request, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Updates an existing clinical review.
     */
    @PutMapping("/cases/{id}/review")
    public ResponseEntity<DoctorReviewDto> updateReview(
            @PathVariable String id,
            @Valid @RequestBody SubmitDoctorReviewRequest request,
            Authentication authentication) {

        DoctorReviewDto response = doctorCaseService.submitOrUpdateReview(id, request, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Returns real-time triage queue metrics for system administration.
     */
    @GetMapping("/triage/stats")
    public ResponseEntity<DoctorTriageStatsResponse> getTriageStats(Authentication authentication) {
        DoctorTriageStatsResponse response = doctorCaseService.getTriageStats(authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Generates or regenerates an AI clinical summary for a submitted case.
     */
    @PostMapping("/cases/{id}/generate-report")
    public ResponseEntity<GeneratedReportSummaryDto> generateReport(
            @PathVariable String id,
            Authentication authentication) {

        GeneratedReportSummaryDto response = aiReportService.generateCaseReport(id, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves an existing generated AI clinical report.
     */
    @GetMapping("/cases/{id}/report")
    public ResponseEntity<GeneratedReportSummaryDto> getReport(
            @PathVariable String id,
            Authentication authentication) {

        GeneratedReportSummaryDto response = aiReportService.getCaseReport(id, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves uploaded medical reports for a case.
     */
    @GetMapping("/cases/{id}/reports")
    public ResponseEntity<List<MedicalReportResponse>> getReports(
            @PathVariable String id,
            Authentication authentication) {

        List<MedicalReportResponse> response = medicalReportService.getCaseReports(id, authentication);
        return ResponseEntity.ok(response);
    }
}
