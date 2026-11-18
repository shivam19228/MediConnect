package com.mediconnect.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class StructuredClinicalSummaryDto {

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

    public StructuredClinicalSummaryDto() {
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
}
