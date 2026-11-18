package com.mediconnect.controller;

import com.mediconnect.dto.request.SubmitDoctorReviewRequest;
import com.mediconnect.dto.response.DoctorCaseDetailResponse;
import com.mediconnect.dto.response.DoctorCaseSummaryResponse;
import com.mediconnect.dto.response.DoctorReviewDto;
import com.mediconnect.dto.response.DoctorTriageStatsResponse;
import com.mediconnect.dto.response.PagedResponse;
import com.mediconnect.entity.enums.ReviewStatus;
import com.mediconnect.service.DoctorCaseService;
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

@RestController
@RequestMapping("/api/v1/doctor")
@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
public class DoctorCaseController {

    private final DoctorCaseService doctorCaseService;
    private final com.mediconnect.service.AiReportService aiReportService;

    public DoctorCaseController(
            DoctorCaseService doctorCaseService,
            com.mediconnect.service.AiReportService aiReportService) {
        this.doctorCaseService = doctorCaseService;
        this.aiReportService = aiReportService;
    }

    /**
     * Lists submitted patient cases for doctor review with pagination, sorting, and filters.
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
            @RequestParam(required = false) String assignedDoctorId,
            @RequestParam(required = false) Boolean assignedToMe,
            Authentication authentication) {

        PagedResponse<DoctorCaseSummaryResponse> response = doctorCaseService.getDoctorCases(
                page, size, status, urgentOnly, search, sortBy, sortDirection, assignedDoctorId, assignedToMe, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves complete clinical details of a single submitted case for doctor review.
     */
    @GetMapping("/cases/{id}")
    public ResponseEntity<DoctorCaseDetailResponse> getCaseDetail(
            @PathVariable String id,
            Authentication authentication) {

        DoctorCaseDetailResponse response = doctorCaseService.getDoctorCaseDetail(id, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Submits a doctor review (notes, triage status, recommendations, follow-up flag).
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
     * Updates an existing review (only permitted by original reviewer or admin).
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
     * Returns real-time triage queue metrics.
     */
    @GetMapping("/triage/stats")
    public ResponseEntity<DoctorTriageStatsResponse> getTriageStats(Authentication authentication) {
        DoctorTriageStatsResponse response = doctorCaseService.getTriageStats(authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Generates or regenerates a structured AI clinical report using Gemini for a submitted case.
     */
    @PostMapping("/cases/{id}/generate-report")
    public ResponseEntity<com.mediconnect.dto.response.GeneratedReportSummaryDto> generateReport(
            @PathVariable String id,
            Authentication authentication) {

        com.mediconnect.dto.response.GeneratedReportSummaryDto response = aiReportService.generateCaseReport(id, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves an existing generated AI clinical report for a case.
     */
    @GetMapping("/cases/{id}/report")
    public ResponseEntity<com.mediconnect.dto.response.GeneratedReportSummaryDto> getReport(
            @PathVariable String id,
            Authentication authentication) {

        com.mediconnect.dto.response.GeneratedReportSummaryDto response = aiReportService.getCaseReport(id, authentication);
        return ResponseEntity.ok(response);
    }
}
