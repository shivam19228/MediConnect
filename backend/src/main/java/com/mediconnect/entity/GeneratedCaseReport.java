package com.mediconnect.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "generated_case_reports")
public class GeneratedCaseReport {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", unique = true, nullable = false)
    private PatientCase patientCase;

    @Size(max = 100)
    @Column(name = "selected_language", length = 100)
    private String selectedLanguage;

    @Column(name = "chief_complaint", columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(name = "history_of_present_illness", columnDefinition = "TEXT")
    private String historyOfPresentIllness;

    @Column(name = "symptom_duration_and_severity", columnDefinition = "TEXT")
    private String symptomDurationAndSeverity;

    @Column(name = "associated_symptoms", columnDefinition = "TEXT")
    private String associatedSymptoms;

    @Column(name = "relevant_medical_history", columnDefinition = "TEXT")
    private String relevantMedicalHistory;

    @Column(name = "current_medicines", columnDefinition = "TEXT")
    private String currentMedicines;

    @Column(name = "known_allergies", columnDefinition = "TEXT")
    private String knownAllergies;

    @Column(name = "previous_medical_reports", columnDefinition = "TEXT")
    private String previousMedicalReports;

    @Column(name = "patient_reported_information", columnDefinition = "TEXT")
    private String patientReportedInformation;

    @Column(name = "missing_or_unanswered_info", columnDefinition = "TEXT")
    private String missingOrUnansweredInformation;

    @Column(name = "items_requiring_doctor_review", columnDefinition = "TEXT")
    private String itemsRequiringDoctorReview;

    @Column(name = "is_demo_generated", nullable = false)
    private Boolean isDemoGenerated = true;

    @NotNull
    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Size(max = 100)
    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "prompt_tokens")
    private Integer promptTokens;

    @Column(name = "completion_tokens")
    private Integer completionTokens;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public GeneratedCaseReport() {
    }

    public GeneratedCaseReport(String chiefComplaint, String historyOfPresentIllness, LocalDateTime generatedAt) {
        this.chiefComplaint = chiefComplaint;
        this.historyOfPresentIllness = historyOfPresentIllness;
        this.generatedAt = generatedAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null || this.id.isBlank()) {
            this.id = UUID.randomUUID().toString();
        }
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.generatedAt == null) {
            this.generatedAt = now;
        }
        if (this.isDemoGenerated == null) {
            this.isDemoGenerated = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public PatientCase getPatientCase() {
        return patientCase;
    }

    public void setPatientCase(PatientCase patientCase) {
        this.patientCase = patientCase;
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

    public String getMissingOrUnansweredInformation() {
        return missingOrUnansweredInformation;
    }

    public void setMissingOrUnansweredInformation(String missingOrUnansweredInformation) {
        this.missingOrUnansweredInformation = missingOrUnansweredInformation;
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

    public void setIsDemoGenerated(Boolean isDemoGenerated) {
        this.isDemoGenerated = isDemoGenerated;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GeneratedCaseReport that = (GeneratedCaseReport) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "GeneratedCaseReport{" +
                "id='" + id + '\'' +
                ", isDemoGenerated=" + isDemoGenerated +
                ", generatedAt=" + generatedAt +
                ", modelName='" + modelName + '\'' +
                '}';
    }
}
