package com.mediconnect.dto.request;

import com.mediconnect.entity.enums.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SubmitDoctorReviewRequest {

    @NotNull(message = "Review status is required")
    private ReviewStatus status;

    @Size(max = 5000, message = "Doctor notes cannot exceed 5000 characters")
    private String doctorNotes;

    @Size(max = 5000, message = "Clinical recommendations cannot exceed 5000 characters")
    private String clinicalRecommendations;

    @NotNull(message = "followUpRequired must be specified")
    private Boolean followUpRequired = false;

    public SubmitDoctorReviewRequest() {
    }

    public SubmitDoctorReviewRequest(ReviewStatus status, String doctorNotes, String clinicalRecommendations, Boolean followUpRequired) {
        this.status = status;
        this.doctorNotes = doctorNotes;
        this.clinicalRecommendations = clinicalRecommendations;
        this.followUpRequired = followUpRequired != null ? followUpRequired : false;
    }

    public ReviewStatus getStatus() {
        return status;
    }

    public void setStatus(ReviewStatus status) {
        this.status = status;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }

    public String getClinicalRecommendations() {
        return clinicalRecommendations;
    }

    public void setClinicalRecommendations(String clinicalRecommendations) {
        this.clinicalRecommendations = clinicalRecommendations;
    }

    public Boolean getFollowUpRequired() {
        return followUpRequired;
    }

    public void setFollowUpRequired(Boolean followUpRequired) {
        this.followUpRequired = followUpRequired;
    }
}
