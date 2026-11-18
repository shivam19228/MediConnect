package com.mediconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.entity.GeneratedCaseReport;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class GeneratedReportSummaryDto {

    private String id;
    private String selectedLanguage;
    private String chiefComplaint;
    private String historyOfPresentIllness;
    private String symptomDurationAndSeverity;
    private String associatedSymptoms;
    private String relevantMedicalHistory;
    private String currentMedicines;
    private String knownAllergies;
    private String previousMedicalReports;
    private String patientReportedInformation;
    private String missingOrUnansweredInfo;
    private String itemsRequiringDoctorReview;
    private Boolean isDemoGenerated;
    private LocalDateTime generatedAt;
    private String modelName;
    private Integer promptTokens;
    private Integer completionTokens;
    private String disclaimer = "AI-generated clinical intake summary. Requires clinician review. Not a confirmed medical diagnosis.";

    public GeneratedReportSummaryDto() {
    }

    public static GeneratedReportSummaryDto fromEntity(GeneratedCaseReport report) {
        if (report == null) return null;

        GeneratedReportSummaryDto dto = new GeneratedReportSummaryDto();
        dto.setId(report.getId());
        dto.setSelectedLanguage(report.getSelectedLanguage());
        dto.setChiefComplaint(report.getChiefComplaint());
        dto.setHistoryOfPresentIllness(report.getHistoryOfPresentIllness());
        dto.setSymptomDurationAndSeverity(report.getSymptomDurationAndSeverity());
        dto.setAssociatedSymptoms(report.getAssociatedSymptoms());
        dto.setRelevantMedicalHistory(report.getRelevantMedicalHistory());
        dto.setCurrentMedicines(report.getCurrentMedicines());
        dto.setKnownAllergies(report.getKnownAllergies());
        dto.setPreviousMedicalReports(report.getPreviousMedicalReports());
        dto.setPatientReportedInformation(report.getPatientReportedInformation());
        dto.setMissingOrUnansweredInfo(report.getMissingOrUnansweredInformation());
        dto.setItemsRequiringDoctorReview(report.getItemsRequiringDoctorReview());
        dto.setIsDemoGenerated(report.getIsDemoGenerated());
        if (Boolean.TRUE.equals(report.getIsDemoGenerated())) {
            dto.setDisclaimer("[COLLEGE DEMO MODE] AI clinical intake summary generated in offline demo mode. Requires clinician review. Not a confirmed medical diagnosis.");
        } else {
            dto.setDisclaimer("AI-generated clinical intake summary. Requires clinician review. Not a confirmed medical diagnosis.");
        }
        dto.setGeneratedAt(report.getGeneratedAt());
        dto.setModelName(report.getModelName());
        dto.setPromptTokens(report.getPromptTokens());
        dto.setCompletionTokens(report.getCompletionTokens());
        return dto;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSelectedLanguage() {
        return selectedLanguage;
    }

    public void setSelectedLanguage(String selectedLanguage) {
        this.selectedLanguage = selectedLanguage;
    }

    public String getChiefComplaint() {
        return chiefComplaint;
    }

    public void setChiefComplaint(String chiefComplaint) {
        this.chiefComplaint = chiefComplaint;
    }

    public String getHistoryOfPresentIllness() {
        return historyOfPresentIllness;
    }

    public void setHistoryOfPresentIllness(String historyOfPresentIllness) {
        this.historyOfPresentIllness = historyOfPresentIllness;
    }

    public String getSymptomDurationAndSeverity() {
        return symptomDurationAndSeverity;
    }

    public void setSymptomDurationAndSeverity(String symptomDurationAndSeverity) {
        this.symptomDurationAndSeverity = symptomDurationAndSeverity;
    }

    public String getAssociatedSymptoms() {
        return associatedSymptoms;
    }

    public void setAssociatedSymptoms(String associatedSymptoms) {
        this.associatedSymptoms = associatedSymptoms;
    }

    public String getRelevantMedicalHistory() {
        return relevantMedicalHistory;
    }

    public void setRelevantMedicalHistory(String relevantMedicalHistory) {
        this.relevantMedicalHistory = relevantMedicalHistory;
    }

    public String getCurrentMedicines() {
        return currentMedicines;
    }

    public void setCurrentMedicines(String currentMedicines) {
        this.currentMedicines = currentMedicines;
    }

    public String getKnownAllergies() {
        return knownAllergies;
    }

    public void setKnownAllergies(String knownAllergies) {
        this.knownAllergies = knownAllergies;
    }

    public String getPreviousMedicalReports() {
        return previousMedicalReports;
    }

    public void setPreviousMedicalReports(String previousMedicalReports) {
        this.previousMedicalReports = previousMedicalReports;
    }

    public String getPatientReportedInformation() {
        return patientReportedInformation;
    }

    public void setPatientReportedInformation(String patientReportedInformation) {
        this.patientReportedInformation = patientReportedInformation;
    }

    public String getMissingOrUnansweredInfo() {
        return missingOrUnansweredInfo;
    }

    public void setMissingOrUnansweredInfo(String missingOrUnansweredInfo) {
        this.missingOrUnansweredInfo = missingOrUnansweredInfo;
    }

    public String getItemsRequiringDoctorReview() {
        return itemsRequiringDoctorReview;
    }

    public void setItemsRequiringDoctorReview(String itemsRequiringDoctorReview) {
        this.itemsRequiringDoctorReview = itemsRequiringDoctorReview;
    }

    public Boolean getIsDemoGenerated() {
        return isDemoGenerated;
    }

    public void setIsDemoGenerated(Boolean demoGenerated) {
        isDemoGenerated = demoGenerated;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public Integer getPromptTokens() {
        return promptTokens;
    }

    public void setPromptTokens(Integer promptTokens) {
        this.promptTokens = promptTokens;
    }

    public Integer getCompletionTokens() {
        return completionTokens;
    }

    public void setCompletionTokens(Integer completionTokens) {
        this.completionTokens = completionTokens;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }
}
