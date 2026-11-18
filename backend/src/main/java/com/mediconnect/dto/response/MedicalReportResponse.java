package com.mediconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.entity.MedicalReport;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class MedicalReportResponse {

    private String id;
    private String caseId;
    private String name;
    private Long size;
    private String type;
    private String storageReference;
    private String uploadDate;
    private Boolean isImage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MedicalReportResponse() {
    }

    public static MedicalReportResponse fromEntity(MedicalReport report) {
        if (report == null) return null;

        MedicalReportResponse res = new MedicalReportResponse();
        res.setId(report.getId());
        if (report.getPatientCase() != null) {
            res.setCaseId(report.getPatientCase().getId());
        }
        res.setName(report.getName());
        res.setSize(report.getSize());
        res.setType(report.getType());
        res.setStorageReference(report.getStorageReference());
        res.setUploadDate(report.getUploadDate());
        res.setIsImage(report.getIsImage());
        res.setCreatedAt(report.getCreatedAt());
        res.setUpdatedAt(report.getUpdatedAt());
        return res;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStorageReference() {
        return storageReference;
    }

    public void setStorageReference(String storageReference) {
        this.storageReference = storageReference;
    }

    public String getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(String uploadDate) {
        this.uploadDate = uploadDate;
    }

    public Boolean getIsImage() {
        return isImage;
    }

    public void setIsImage(Boolean image) {
        isImage = image;
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
