package com.mediconnect.controller;

import com.mediconnect.dto.request.AssignDoctorRequest;
import com.mediconnect.dto.request.SubmitDoctorReviewRequest;
import com.mediconnect.dto.response.DoctorCaseDetailResponse;
import com.mediconnect.dto.response.DoctorCaseSummaryResponse;
import com.mediconnect.dto.response.DoctorReviewDto;
import com.mediconnect.dto.response.DoctorTriageStatsResponse;
import com.mediconnect.dto.response.PagedResponse;
import com.mediconnect.dto.response.UserSummaryDto;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.ReviewStatus;
import com.mediconnect.entity.enums.SeverityLevel;
import com.mediconnect.service.DoctorCaseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

class DoctorAndAdminCaseControllerTest {

    private Authentication adminAuth;
    private StubDoctorCaseService doctorCaseService;
    private AdminController adminController;

    private static class StubDoctorCaseService extends DoctorCaseService {
        PagedResponse<DoctorCaseSummaryResponse> pagedResponseToReturn;
        DoctorCaseDetailResponse detailResponseToReturn;
        DoctorTriageStatsResponse statsToReturn;
        DoctorReviewDto reviewToReturn;
        List<UserSummaryDto> doctorsToReturn;
        DoctorCaseSummaryResponse assignResponseToReturn;
        final AtomicBoolean submitReviewCalled = new AtomicBoolean(false);
        final AtomicBoolean assignDoctorCalled = new AtomicBoolean(false);

        public StubDoctorCaseService() {
            super(null, null, null);
        }

        @Override
        public PagedResponse<DoctorCaseSummaryResponse> getDoctorCases(
                int page, int size, ReviewStatus status, Boolean urgentOnly,
                String search, String sortBy, String sortDirection, Authentication auth) {
            return pagedResponseToReturn;
        }

        @Override
        public DoctorCaseDetailResponse getDoctorCaseDetail(String caseId, Authentication auth) {
            return detailResponseToReturn;
        }

        @Override
        public DoctorTriageStatsResponse getTriageStats(Authentication auth) {
            return statsToReturn;
        }

        @Override
        public DoctorReviewDto submitOrUpdateReview(String caseId, SubmitDoctorReviewRequest request, Authentication auth) {
            submitReviewCalled.set(true);
            return reviewToReturn;
        }

        @Override
        public List<UserSummaryDto> getAvailableDoctors() {
            return doctorsToReturn;
        }

        @Override
        public DoctorCaseSummaryResponse assignDoctorToCase(String caseId, String targetDoctorId, Authentication auth) {
            assignDoctorCalled.set(true);
            return assignResponseToReturn;
        }
    }

    @BeforeEach
    void setUp() {
        adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@mediconnect.com",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        doctorCaseService = new StubDoctorCaseService();
        adminController = new AdminController(doctorCaseService, null, null);
    }

    @Test
    void doctorCaseSummaryResponse_serializesIdMatchingCaseId() {
        PatientCase patientCase = new PatientCase("Ramesh Kumar", "hi", SeverityLevel.SEVERE);
        patientCase.setId("real-db-uuid-12345");
        patientCase.setPatientAge(52);
        patientCase.setPatientGender("Male");
        patientCase.setStatus(CaseStatus.SUBMITTED);

        DoctorCaseSummaryResponse summary = DoctorCaseSummaryResponse.fromEntity(patientCase);

        assertThat(summary).isNotNull();
        // Crucial bug fix verification: id must equal the real database caseId, not undefined
        assertThat(summary.getId()).isEqualTo("real-db-uuid-12345");
        assertThat(summary.getCaseId()).isEqualTo("real-db-uuid-12345");
        assertThat(summary.getPatientAge()).isEqualTo(52);
        assertThat(summary.getPatientGender()).isEqualTo("Male");
        assertThat(summary.getLanguage()).isEqualTo("hi");
        assertThat(summary.getHasAiReport()).isFalse();
    }

    @Test
    void adminController_getCases_returnsPagedCases() {
        DoctorCaseSummaryResponse item = new DoctorCaseSummaryResponse();
        item.setCaseId("case-001");
        item.setId("case-001");
        doctorCaseService.pagedResponseToReturn =
                new PagedResponse<>(List.of(item), 0, 10, 1L, 1, true, true, false, false);

        ResponseEntity<PagedResponse<DoctorCaseSummaryResponse>> response =
                adminController.getCases(0, 10, null, null, null, "urgent", "DESC", adminAuth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getContent()).hasSize(1);
        assertThat(response.getBody().getContent().get(0).getId()).isEqualTo("case-001");
    }

    @Test
    void adminController_getCaseDetail_returnsFullCase() {
        DoctorCaseDetailResponse detail = new DoctorCaseDetailResponse();
        detail.setId("case-001");
        detail.setPatientAge(45);
        detail.setPatientGender("Female");
        detail.setCaseStatus(CaseStatus.SUBMITTED);

        doctorCaseService.detailResponseToReturn = detail;

        ResponseEntity<DoctorCaseDetailResponse> response = adminController.getCaseDetail("case-001", adminAuth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo("case-001");
        assertThat(response.getBody().getPatientAge()).isEqualTo(45);
    }

    @Test
    void adminController_getTriageStats_returnsMetrics() {
        doctorCaseService.statsToReturn = new DoctorTriageStatsResponse(10L, 4L, 2L, 4L, 1L);

        ResponseEntity<DoctorTriageStatsResponse> response = adminController.getTriageStats(adminAuth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getTotalSubmitted()).isEqualTo(10L);
        assertThat(response.getBody().getPendingReview()).isEqualTo(4L);
    }

    @Test
    void adminController_submitReview_delegatesToDoctorCaseService() {
        SubmitDoctorReviewRequest request = new SubmitDoctorReviewRequest();
        request.setStatus(ReviewStatus.REVIEWED);
        request.setDoctorNotes("Reviewed by supervisor");

        DoctorReviewDto reviewDto = new DoctorReviewDto();
        reviewDto.setStatus(ReviewStatus.REVIEWED);
        reviewDto.setDoctorNotes("Reviewed by supervisor");
        doctorCaseService.reviewToReturn = reviewDto;

        ResponseEntity<DoctorReviewDto> response = adminController.submitReview("case-001", request, adminAuth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(ReviewStatus.REVIEWED);
        assertThat(doctorCaseService.submitReviewCalled.get()).isTrue();
    }

    @Test
    void adminController_getAvailableDoctors_returnsDoctorsList() {
        UserSummaryDto doc = new UserSummaryDto(
                "doc-123", "Dr. Rajesh Sharma", "doctor@demo.com", "DOCTOR", "+919876543210", null, "Cardiology"
        );
        doctorCaseService.doctorsToReturn = List.of(doc);

        ResponseEntity<List<UserSummaryDto>> response = adminController.getAvailableDoctors();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getName()).isEqualTo("Dr. Rajesh Sharma");
        assertThat(response.getBody().get(0).getSpecialty()).isEqualTo("Cardiology");
    }

    @Test
    void adminController_assignDoctor_delegatesToDoctorCaseService() {
        AssignDoctorRequest request = new AssignDoctorRequest();
        request.setDoctorId("doc-123");

        DoctorCaseSummaryResponse summary = new DoctorCaseSummaryResponse();
        summary.setId("case-001");
        summary.setCaseId("case-001");
        summary.setReviewedByDoctorId("doc-123");
        summary.setReviewedByDoctorName("Dr. Rajesh Sharma");
        doctorCaseService.assignResponseToReturn = summary;

        ResponseEntity<DoctorCaseSummaryResponse> response = adminController.assignDoctor("case-001", request, adminAuth);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo("case-001");
        assertThat(response.getBody().getReviewedByDoctorName()).isEqualTo("Dr. Rajesh Sharma");
        assertThat(doctorCaseService.assignDoctorCalled.get()).isTrue();
    }
}

