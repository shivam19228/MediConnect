package com.mediconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.SeverityLevel;

import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CaseSummaryResponse {
    private String id;
    private String patientId;
    private String patientName;
    private String tokenNumber;
    private CaseStatus status;
    private String language;
    private List<String> primarySymptoms;
    private SeverityLevel severity;
    private String duration;
    private Boolean isEmergencyFlagged;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CaseSummaryResponse() {
    }

    public static CaseSummaryResponse fromEntity(PatientCase patientCase) {
        if (patientCase == null) return null;
        CaseSummaryResponse res = new CaseSummaryResponse();
        res.setId(patientCase.getId());
        if (patientCase.getPatient() != null) {
            res.setPatientId(patientCase.getPatient().getId());
        }
        res.setPatientName(patientCase.getPatientName());
        if (patientCase.getIntakeToken() != null) {
            res.setTokenNumber(patientCase.getIntakeToken().getTokenNumber());
        }
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

    public String getTokenNumber() {
        return tokenNumber;
    }

    public void setTokenNumber(String tokenNumber) {
        this.tokenNumber = tokenNumber;
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
