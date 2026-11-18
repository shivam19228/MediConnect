package com.mediconnect.dto.ai;

import com.mediconnect.dto.request.CaseAnswerDto;
import com.mediconnect.dto.request.MedicalHistoryDto;
import com.mediconnect.entity.enums.SeverityLevel;

import java.util.ArrayList;
import java.util.List;

/**
 * Sanitized, privacy-compliant clinical context passed to Gemini AI.
 * Explicitly excludes all direct patient identifiers (name, phone, email, address).
 * Includes extracted text and raw multimodal document contents from uploaded medical reports.
 */
public class GeminiPromptContext {

    private String caseId;
    private Integer patientAge;
    private String patientGender;
    private String selectedLanguage;
    private List<String> primarySymptoms;
    private SeverityLevel severity;
    private String duration;
    private Boolean isEmergencyFlagged;
    private List<CaseAnswerDto> symptomAnswers;
    private MedicalHistoryDto medicalHistory;
    private List<String> uploadedReportNames;
    private List<ProcessedDocumentContent> attachedDocuments = new ArrayList<>();

    public GeminiPromptContext() {
    }

    public GeminiPromptContext(String caseId, Integer patientAge, String patientGender, String selectedLanguage,
                               List<String> primarySymptoms, SeverityLevel severity, String duration,
                               Boolean isEmergencyFlagged, List<CaseAnswerDto> symptomAnswers,
                               MedicalHistoryDto medicalHistory, List<String> uploadedReportNames) {
        this.caseId = caseId;
        this.patientAge = patientAge;
        this.patientGender = patientGender;
        this.selectedLanguage = selectedLanguage;
        this.primarySymptoms = primarySymptoms;
        this.severity = severity;
        this.duration = duration;
        this.isEmergencyFlagged = isEmergencyFlagged;
        this.symptomAnswers = symptomAnswers;
        this.medicalHistory = medicalHistory;
        this.uploadedReportNames = uploadedReportNames;
    }

    public GeminiPromptContext(String caseId, Integer patientAge, String patientGender, String selectedLanguage,
                               List<String> primarySymptoms, SeverityLevel severity, String duration,
                               Boolean isEmergencyFlagged, List<CaseAnswerDto> symptomAnswers,
                               MedicalHistoryDto medicalHistory, List<String> uploadedReportNames,
                               List<ProcessedDocumentContent> attachedDocuments) {
        this(caseId, patientAge, patientGender, selectedLanguage, primarySymptoms, severity, duration,
                isEmergencyFlagged, symptomAnswers, medicalHistory, uploadedReportNames);
        this.attachedDocuments = attachedDocuments != null ? attachedDocuments : new ArrayList<>();
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

    public String getSelectedLanguage() {
        return selectedLanguage;
    }

    public void setSelectedLanguage(String selectedLanguage) {
        this.selectedLanguage = selectedLanguage;
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

    public List<String> getUploadedReportNames() {
        return uploadedReportNames;
    }

    public void setUploadedReportNames(List<String> uploadedReportNames) {
        this.uploadedReportNames = uploadedReportNames;
    }

    public List<ProcessedDocumentContent> getAttachedDocuments() {
        return attachedDocuments;
    }

    public void setAttachedDocuments(List<ProcessedDocumentContent> attachedDocuments) {
        this.attachedDocuments = attachedDocuments != null ? attachedDocuments : new ArrayList<>();
    }
}
