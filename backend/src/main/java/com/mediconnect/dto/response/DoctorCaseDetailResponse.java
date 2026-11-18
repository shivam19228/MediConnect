package com.mediconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.dto.request.CaseAnswerDto;
import com.mediconnect.dto.request.MedicalHistoryDto;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.SeverityLevel;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DoctorCaseDetailResponse {

    private String id;
    private IntakeTokenDto token;
    private Integer patientAge;
    private String patientGender;
    private String language;
    private SeverityLevel severity;
    private String duration;
    private Boolean isEmergencyFlagged;
    private List<String> primarySymptoms;
    private CaseStatus caseStatus;
    private List<CaseAnswerDto> symptomAnswers;
    private MedicalHistoryDto medicalHistory;
    private List<MedicalReportSummaryDto> uploadedReports;
    private GeneratedReportSummaryDto generatedReport;
    private DoctorReviewDto review;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DoctorCaseDetailResponse() {
    }

    public static DoctorCaseDetailResponse fromEntity(PatientCase patientCase) {
        if (patientCase == null) return null;

        DoctorCaseDetailResponse res = new DoctorCaseDetailResponse();
        res.setId(patientCase.getId());
        res.setPatientAge(patientCase.getPatientAge());
        res.setPatientGender(patientCase.getPatientGender());
        res.setLanguage(patientCase.getLanguage());
        res.setSeverity(patientCase.getSeverity());
        res.setDuration(patientCase.getDuration());
        res.setIsEmergencyFlagged(patientCase.getIsEmergencyFlagged());
        res.setCaseStatus(patientCase.getStatus());
        res.setCreatedAt(patientCase.getCreatedAt());
        res.setUpdatedAt(patientCase.getUpdatedAt());

        if (patientCase.getPrimarySymptoms() != null) {
            res.setPrimarySymptoms(new ArrayList<>(patientCase.getPrimarySymptoms()));
        } else {
            res.setPrimarySymptoms(Collections.emptyList());
        }

        if (patientCase.getIntakeToken() != null) {
            res.setToken(IntakeTokenDto.fromEntity(patientCase.getIntakeToken()));
        }

        if (patientCase.getSymptomAnswers() != null) {
            res.setSymptomAnswers(patientCase.getSymptomAnswers().stream()
                    .map(a -> new CaseAnswerDto(a.getQuestionId(), a.getQuestionText(), a.getAnswer(), a.getAudioUsed()))
                    .toList());
        } else {
            res.setSymptomAnswers(Collections.emptyList());
        }

        if (patientCase.getMedicalHistory() != null) {
            res.setMedicalHistory(MedicalHistoryDto.fromEntity(patientCase.getMedicalHistory()));
        }

        if (patientCase.getUploadedReports() != null) {
            res.setUploadedReports(patientCase.getUploadedReports().stream()
                    .map(MedicalReportSummaryDto::fromEntity)
                    .toList());
        } else {
            res.setUploadedReports(Collections.emptyList());
        }

        if (patientCase.getGeneratedReport() != null) {
            res.setGeneratedReport(GeneratedReportSummaryDto.fromEntity(patientCase.getGeneratedReport()));
        }

        if (patientCase.getDoctorReview() != null) {
            res.setReview(DoctorReviewDto.fromEntity(patientCase.getDoctorReview()));
        }

        return res;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public IntakeTokenDto getToken() {
        return token;
    }

    public void setToken(IntakeTokenDto token) {
        this.token = token;
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

    public List<String> getPrimarySymptoms() {
        return primarySymptoms;
    }

    public void setPrimarySymptoms(List<String> primarySymptoms) {
        this.primarySymptoms = primarySymptoms;
    }

    public CaseStatus getCaseStatus() {
        return caseStatus;
    }

    public void setCaseStatus(CaseStatus caseStatus) {
        this.caseStatus = caseStatus;
    }

    public List<CaseAnswerDto> getSymptomAnswers() {
        return symptomAnswers;
    }

    public void setSymptomAnswers(List<CaseAnswerDto> symptomAnswers) {
        this.symptomAnswers = symptomAnswers;
    }

    public MedicalHistoryDto getMedicalHistory() {
        return medicalHistory;
    }

    public void setMedicalHistory(MedicalHistoryDto medicalHistory) {
        this.medicalHistory = medicalHistory;
    }

    public List<MedicalReportSummaryDto> getUploadedReports() {
        return uploadedReports;
    }

    public void setUploadedReports(List<MedicalReportSummaryDto> uploadedReports) {
        this.uploadedReports = uploadedReports;
    }

    public GeneratedReportSummaryDto getGeneratedReport() {
        return generatedReport;
    }

    public void setGeneratedReport(GeneratedReportSummaryDto generatedReport) {
        this.generatedReport = generatedReport;
    }

    public DoctorReviewDto getReview() {
        return review;
    }

    public void setReview(DoctorReviewDto review) {
        this.review = review;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
