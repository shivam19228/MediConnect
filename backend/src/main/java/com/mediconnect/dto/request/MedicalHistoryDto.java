package com.mediconnect.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.entity.MedicalHistory;
import jakarta.validation.constraints.Size;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class MedicalHistoryDto {

    @Size(max = 2000, message = "conditions cannot exceed 2000 characters")
    private String conditions;

    @Size(max = 2000, message = "medications cannot exceed 2000 characters")
    private String medications;

    @Size(max = 2000, message = "allergies cannot exceed 2000 characters")
    private String allergies;

    @Size(max = 2000, message = "pastSurgeries cannot exceed 2000 characters")
    private String pastSurgeries;

    @Size(max = 2000, message = "familyHistory cannot exceed 2000 characters")
    private String familyHistory;

    private Boolean provided = false;

    public MedicalHistoryDto() {
    }

    public MedicalHistoryDto(String conditions, String medications, String allergies, String pastSurgeries, String familyHistory, Boolean provided) {
        this.conditions = conditions;
        this.medications = medications;
        this.allergies = allergies;
        this.pastSurgeries = pastSurgeries;
        this.familyHistory = familyHistory;
        this.provided = provided != null ? provided : false;
    }

    public static MedicalHistoryDto fromEntity(MedicalHistory history) {
        if (history == null) return null;
        return new MedicalHistoryDto(
                history.getConditions(),
                history.getMedications(),
                history.getAllergies(),
                history.getPastSurgeries(),
                history.getFamilyHistory(),
                history.getProvided()
        );
    }

    public String getConditions() {
        return conditions;
    }

    public void setConditions(String conditions) {
        this.conditions = conditions;
    }

    public String getMedications() {
        return medications;
    }

    public void setMedications(String medications) {
        this.medications = medications;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getPastSurgeries() {
        return pastSurgeries;
    }

    public void setPastSurgeries(String pastSurgeries) {
        this.pastSurgeries = pastSurgeries;
    }

    public String getFamilyHistory() {
        return familyHistory;
    }

    public void setFamilyHistory(String familyHistory) {
        this.familyHistory = familyHistory;
    }

    public Boolean getProvided() {
        return provided;
    }

    public void setProvided(Boolean provided) {
        this.provided = provided;
    }
}
