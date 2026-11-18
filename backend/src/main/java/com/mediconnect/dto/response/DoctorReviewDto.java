package com.mediconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.entity.DoctorReview;
import com.mediconnect.entity.enums.ReviewStatus;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DoctorReviewDto {

    private String id;
    private String caseId;
    private ReviewStatus status;
    private String doctorNotes;
    private String clinicalRecommendations;
    private Boolean followUpRequired;
    private String reviewedByDoctorId;
    private String reviewedByDoctorName;
    private String reviewedByDoctorSpecialty;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DoctorReviewDto() {
    }

    public static DoctorReviewDto fromEntity(DoctorReview review) {
        if (review == null) return null;

        DoctorReviewDto dto = new DoctorReviewDto();
        dto.setId(review.getId());
        if (review.getPatientCase() != null) {
            dto.setCaseId(review.getPatientCase().getId());
        }
        dto.setStatus(review.getStatus());
        dto.setDoctorNotes(review.getDoctorNotes());
        dto.setClinicalRecommendations(review.getClinicalRecommendations());
        dto.setFollowUpRequired(review.getFollowUpRequired());
        dto.setReviewedAt(review.getReviewedAt());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUpdatedAt(review.getUpdatedAt());

        if (review.getReviewedByDoctor() != null) {
            dto.setReviewedByDoctorId(review.getReviewedByDoctor().getId());
            dto.setReviewedByDoctorName(review.getReviewedByDoctor().getFullName());
            dto.setReviewedByDoctorSpecialty(review.getReviewedByDoctor().getSpecialty());
        }

        return dto;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
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

    public String getReviewedByDoctorId() {
        return reviewedByDoctorId;
    }

    public void setReviewedByDoctorId(String reviewedByDoctorId) {
        this.reviewedByDoctorId = reviewedByDoctorId;
    }

    public String getReviewedByDoctorName() {
        return reviewedByDoctorName;
    }

    public void setReviewedByDoctorName(String reviewedByDoctorName) {
        this.reviewedByDoctorName = reviewedByDoctorName;
    }

    public String getReviewedByDoctorSpecialty() {
        return reviewedByDoctorSpecialty;
    }

    public void setReviewedByDoctorSpecialty(String reviewedByDoctorSpecialty) {
        this.reviewedByDoctorSpecialty = reviewedByDoctorSpecialty;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
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
