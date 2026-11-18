package com.mediconnect.controller;

import com.mediconnect.dto.response.DownloadedDocument;
import com.mediconnect.dto.response.MedicalReportResponse;
import com.mediconnect.dto.response.SignedUrlResponse;
import com.mediconnect.service.MedicalReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * REST controller for patient and clinical staff medical report operations.
 * Communicates with local medical document storage via Spring Boot endpoints.
 */
@RestController
@RequestMapping("/api/v1")
public class MedicalReportController {

    private final MedicalReportService medicalReportService;

    public MedicalReportController(MedicalReportService medicalReportService) {
        this.medicalReportService = medicalReportService;
    }

    // ========================================================
    // Patient Endpoints
    // ========================================================

    @PostMapping(value = "/patient/cases/{caseId}/reports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<MedicalReportResponse> uploadPatientReport(
            @PathVariable String caseId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        MedicalReportResponse response = medicalReportService.uploadReport(caseId, file, authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/patient/cases/{caseId}/reports")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<MedicalReportResponse>> getPatientReports(
            @PathVariable String caseId,
            Authentication authentication) {

        List<MedicalReportResponse> response = medicalReportService.getCaseReports(caseId, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient/cases/{caseId}/reports/{reportId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<MedicalReportResponse> getPatientReportMetadata(
            @PathVariable String caseId,
            @PathVariable String reportId,
            Authentication authentication) {

        MedicalReportResponse response = medicalReportService.getReportMetadata(caseId, reportId, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patient/cases/{caseId}/reports/{reportId}/signed-url")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<SignedUrlResponse> getPatientReportSignedUrl(
            @PathVariable String caseId,
            @PathVariable String reportId,
            @RequestParam(defaultValue = "300") int expiresInSeconds,
            Authentication authentication) {

        SignedUrlResponse response = medicalReportService.generateSignedUrl(caseId, reportId, expiresInSeconds, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping({"/patient/cases/{caseId}/reports/{reportId}/view", "/patient/cases/{caseId}/reports/{reportId}/raw"})
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<byte[]> viewPatientReport(
            @PathVariable String caseId,
            @PathVariable String reportId,
            Authentication authentication) {

        DownloadedDocument doc = medicalReportService.downloadDocument(caseId, reportId, authentication);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(doc.contentType()));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.filename() + "\"");
        headers.setContentLength(doc.data().length);

        return new ResponseEntity<>(doc.data(), headers, HttpStatus.OK);
    }

    @GetMapping("/patient/cases/{caseId}/reports/{reportId}/download")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<byte[]> downloadPatientReport(
            @PathVariable String caseId,
            @PathVariable String reportId,
            Authentication authentication) {

        DownloadedDocument doc = medicalReportService.downloadDocument(caseId, reportId, authentication);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(doc.contentType()));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.filename() + "\"");
        headers.setContentLength(doc.data().length);

        return new ResponseEntity<>(doc.data(), headers, HttpStatus.OK);
    }

    @DeleteMapping("/patient/cases/{caseId}/reports/{reportId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Map<String, String>> deletePatientReport(
            @PathVariable String caseId,
            @PathVariable String reportId,
            Authentication authentication) {

        medicalReportService.deleteReport(caseId, reportId, authentication);
        return ResponseEntity.ok(Map.of("message", "Medical report successfully deleted."));
    }

    // ========================================================
    // Doctor and Administrative Endpoints
    // ========================================================

    @GetMapping("/doctor/cases/{caseId}/reports")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<MedicalReportResponse>> getDoctorReports(
            @PathVariable String caseId,
            Authentication authentication) {

        List<MedicalReportResponse> response = medicalReportService.getCaseReports(caseId, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctor/cases/{caseId}/reports/{reportId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<MedicalReportResponse> getDoctorReportMetadata(
            @PathVariable String caseId,
            @PathVariable String reportId,
            Authentication authentication) {

        MedicalReportResponse response = medicalReportService.getReportMetadata(caseId, reportId, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/doctor/cases/{caseId}/reports/{reportId}/signed-url")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<SignedUrlResponse> getDoctorReportSignedUrl(
            @PathVariable String caseId,
            @PathVariable String reportId,
            @RequestParam(defaultValue = "300") int expiresInSeconds,
            Authentication authentication) {

        SignedUrlResponse response = medicalReportService.generateSignedUrl(caseId, reportId, expiresInSeconds, authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping({"/doctor/cases/{caseId}/reports/{reportId}/view", "/doctor/cases/{caseId}/reports/{reportId}/raw"})
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<byte[]> viewDoctorReport(
            @PathVariable String caseId,
            @PathVariable String reportId,
            Authentication authentication) {

        DownloadedDocument doc = medicalReportService.downloadDocument(caseId, reportId, authentication);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(doc.contentType()));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.filename() + "\"");
        headers.setContentLength(doc.data().length);

        return new ResponseEntity<>(doc.data(), headers, HttpStatus.OK);
    }

    @GetMapping("/doctor/cases/{caseId}/reports/{reportId}/download")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<byte[]> downloadDoctorReport(
            @PathVariable String caseId,
            @PathVariable String reportId,
            Authentication authentication) {

        DownloadedDocument doc = medicalReportService.downloadDocument(caseId, reportId, authentication);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(doc.contentType()));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.filename() + "\"");
        headers.setContentLength(doc.data().length);

        return new ResponseEntity<>(doc.data(), headers, HttpStatus.OK);
    }

    @DeleteMapping("/doctor/cases/{caseId}/reports/{reportId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteDoctorReport(
            @PathVariable String caseId,
            @PathVariable String reportId,
            Authentication authentication) {

        medicalReportService.deleteReport(caseId, reportId, authentication);
        return ResponseEntity.ok(Map.of("message", "Medical report successfully deleted by administrator."));
    }
}
