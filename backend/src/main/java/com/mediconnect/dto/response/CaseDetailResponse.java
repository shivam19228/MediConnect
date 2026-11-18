package com.mediconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.dto.request.CaseAnswerDto;
import com.mediconnect.dto.request.MedicalHistoryDto;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.SeverityLevel;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CaseDetailResponse {
    private String id;
    private String patientId;
    private String patientName;
    private Integer patientAge;
    private String patientGender;
    private String patientPhone;
    private CaseStatus status;
    private String language;
    private List<String> primarySymptoms;
    private SeverityLevel severity;
    private String duration;
    private Boolean isEmergencyFlagged;
    private List<CaseAnswerDto> symptomAnswers;
    private MedicalHistoryDto medicalHistory;
    private IntakeTokenDto token;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CaseDetailResponse() {
    }

    public static CaseDetailResponse fromEntity(PatientCase patientCase) {
        if (patientCase == null) return null;
        CaseDetailResponse res = new CaseDetailResponse();
        res.setId(patientCase.getId());
        if (patientCase.getPatient() != null) {
            res.setPatientId(patientCase.getPatient().getId());
        }
        res.setPatientName(patientCase.getPatientName());
        res.setPatientAge(patientCase.getPatientAge());
        res.setPatientGender(patientCase.getPatientGender());
        res.setPatientPhone(patientCase.getPatientPhone());
        res.setStatus(patientCase.getStatus());
        res.setLanguage(patientCase.getLanguage());
        if (patientCase.getPrimarySymptoms() != null) {
            res.setPrimarySymptoms(new java.util.ArrayList<>(patientCase.getPrimarySymptoms()));
        } else {
            res.setPrimarySymptoms(java.util.Collections.emptyList());
        }
        res.setSeverity(patientCase.getSeverity());
        res.setDuration(patientCase.getDuration());
        res.setIsEmergencyFlagged(patientCase.getIsEmergencyFlagged());

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

        if (patientCase.getIntakeToken() != null) {
            res.setToken(IntakeTokenDto.fromEntity(patientCase.getIntakeToken()));
        }

        res.setCreatedAt(patientCase.getCreatedAt());
        res.setUpdatedAt(patientCase.getUpdatedAt());
        return res;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
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

    public String getPatientPhone() {
        return patientPhone;
    }

    public void setPatientPhone(String patientPhone) {
        this.patientPhone = patientPhone;
    }

    public CaseStatus getStatus() {
        return status;
    }

    public void setStatus(CaseStatus status) {
        this.status = status;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
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

    public IntakeTokenDto getToken() {
        return token;
    }

    public void setToken(IntakeTokenDto token) {
        this.token = token;
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
