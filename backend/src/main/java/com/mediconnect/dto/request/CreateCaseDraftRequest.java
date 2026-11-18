package com.mediconnect.dto.request;

import com.mediconnect.entity.enums.SeverityLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CreateCaseDraftRequest {

    @Size(max = 100, message = "patientName cannot exceed 100 characters")
    private String patientName;

    @Min(value = 0, message = "Age cannot be negative")
    @Max(value = 150, message = "Age cannot exceed 150")
    private Integer patientAge;

    @Size(max = 20, message = "patientGender cannot exceed 20 characters")
    private String patientGender;

    @Size(max = 30, message = "patientPhone cannot exceed 30 characters")
    private String patientPhone;

    @Size(max = 10, message = "Language code cannot exceed 10 characters")
    private String language;

    private List<String> primarySymptoms;

    private SeverityLevel severity;

    @Size(max = 100, message = "duration cannot exceed 100 characters")
    private String duration;

    private Boolean isEmergencyFlagged;

    public CreateCaseDraftRequest() {
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
}
