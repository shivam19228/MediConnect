package com.mediconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.entity.DoctorReview;
import com.mediconnect.entity.IntakeToken;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.ReviewStatus;
import com.mediconnect.entity.enums.SeverityLevel;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DoctorCaseSummaryResponse {

    private String caseId;
    private String tokenNumber;
    private Integer patientAge;
    private String patientGender;
    private String language;
    private Boolean hasAiReport;
    private LocalDateTime submittedAt;
    private String formattedDate;
    private String formattedTime;
    private String department;
    private List<String> primarySymptoms;
    private SeverityLevel severity;
    private String duration;
    private Boolean isEmergencyFlagged;
    private CaseStatus caseStatus;
    private ReviewStatus reviewStatus;
    private String reviewedByDoctorId;
    private String reviewedByDoctorName;
    private LocalDateTime reviewedAt;
    private Boolean followUpRequired;
    private Integer uploadedReportCount;
    private LocalDateTime createdAt;

    public DoctorCaseSummaryResponse() {
    }

    public static DoctorCaseSummaryResponse fromEntity(PatientCase patientCase) {
        if (patientCase == null) return null;

        DoctorCaseSummaryResponse res = new DoctorCaseSummaryResponse();
        res.setCaseId(patientCase.getId());
        res.setPatientAge(patientCase.getPatientAge());
        res.setPatientGender(patientCase.getPatientGender());
        res.setLanguage(patientCase.getLanguage());
        res.setHasAiReport(patientCase.getGeneratedReport() != null);
        res.setCaseStatus(patientCase.getStatus());
        res.setSeverity(patientCase.getSeverity());
        res.setDuration(patientCase.getDuration());
        res.setIsEmergencyFlagged(patientCase.getIsEmergencyFlagged());
        res.setCreatedAt(patientCase.getCreatedAt());

        if (patientCase.getPrimarySymptoms() != null) {
            res.setPrimarySymptoms(new ArrayList<>(patientCase.getPrimarySymptoms()));
        } else {
            res.setPrimarySymptoms(Collections.emptyList());
        }

        IntakeToken token = patientCase.getIntakeToken();
        if (token != null) {
            res.setTokenNumber(token.getTokenNumber());
            res.setSubmittedAt(token.getSubmittedAt());
            res.setFormattedDate(token.getFormattedDate());
            res.setFormattedTime(token.getFormattedTime());
            res.setDepartment(token.getDepartment());
            res.setUploadedReportCount(token.getUploadedReportCount());
        }

        DoctorReview review = patientCase.getDoctorReview();
        if (review != null) {
            res.setReviewStatus(review.getStatus());
            res.setFollowUpRequired(review.getFollowUpRequired());
            res.setReviewedAt(review.getReviewedAt());
            if (review.getReviewedByDoctor() != null) {
                res.setReviewedByDoctorId(review.getReviewedByDoctor().getId());
                res.setReviewedByDoctorName(review.getReviewedByDoctor().getFullName());
            }
        } else {
            res.setReviewStatus(ReviewStatus.PENDING_REVIEW);
            res.setFollowUpRequired(false);
        }

        return res;
    }

    public String getId() {
        return caseId;
    }

    public void setId(String id) {
        this.caseId = id;
    }

    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
    }

    public Integer getPatientAge() {
        return patientAge;
    }

    public void setPatientAge(Integer patientAge) {
        this.patientAge = patientAge;
    }

    public String getPatientGender() {
        return patientGender;
    }

    public void setPatientGender(String patientGender) {
        this.patientGender = patientGender;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Boolean getHasAiReport() {
        return hasAiReport;
    }

    public void setHasAiReport(Boolean hasAiReport) {
        this.hasAiReport = hasAiReport;
    }

    public String getTokenNumber() {
        return tokenNumber;
    }

    public void setTokenNumber(String tokenNumber) {
        this.tokenNumber = tokenNumber;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getFormattedDate() {
        return formattedDate;
    }

    public void setFormattedDate(String formattedDate) {
        this.formattedDate = formattedDate;
    }

    public String getFormattedTime() {
        return formattedTime;
    }

    public void setFormattedTime(String formattedTime) {
        this.formattedTime = formattedTime;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public List<String> getPrimarySymptoms() {
        return primarySymptoms;
    }

    public void setPrimarySymptoms(List<String> primarySymptoms) {
        this.primarySymptoms = primarySymptoms;
    }

    public SeverityLevel getSeverity() {
        return severity;
    }

    public void setSeverity(SeverityLevel severity) {
        this.severity = severity;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public Boolean getIsEmergencyFlagged() {
        return isEmergencyFlagged;
    }

    public void setIsEmergencyFlagged(Boolean isEmergencyFlagged) {
        this.isEmergencyFlagged = isEmergencyFlagged;
    }

    public CaseStatus getCaseStatus() {
        return caseStatus;
    }

    public void setCaseStatus(CaseStatus caseStatus) {
        this.caseStatus = caseStatus;
    }

    public ReviewStatus getReviewStatus() {
        return reviewStatus;
    }

    public void setReviewStatus(ReviewStatus reviewStatus) {
        this.reviewStatus = reviewStatus;
    }

    public String getReviewedByDoctorId() {
        return reviewedByDoctorId;
    }

    public void setReviewedByDoctorId(String reviewedByDoctorId) {
        this.reviewedByDoctorId = reviewedByDoctorId;
    }

    public String getReviewedByDoctorName() {
        return reviewedByDoctorName;
    }

    public void setReviewedByDoctorName(String reviewedByDoctorName) {
        this.reviewedByDoctorName = reviewedByDoctorName;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public Boolean getFollowUpRequired() {
        return followUpRequired;
    }

    public void setFollowUpRequired(Boolean followUpRequired) {
        this.followUpRequired = followUpRequired;
    }

    public Integer getUploadedReportCount() {
        return uploadedReportCount;
    }

    public void setUploadedReportCount(Integer uploadedReportCount) {
        this.uploadedReportCount = uploadedReportCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
