package com.mediconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.entity.MedicalReport;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class MedicalReportSummaryDto {

    private String id;
    private String name;
    private Long size;
    private String type;
    private Boolean isImage;
    private String previewUrl;
    private String uploadDate;
    private LocalDateTime createdAt;

    public MedicalReportSummaryDto() {
    }

    public static MedicalReportSummaryDto fromEntity(MedicalReport report) {
        if (report == null) return null;

        MedicalReportSummaryDto dto = new MedicalReportSummaryDto();
        dto.setId(report.getId());
        dto.setName(report.getName());
        dto.setSize(report.getSize());
        dto.setType(report.getType());
        dto.setIsImage(report.getIsImage());
        dto.setPreviewUrl(report.getPreviewUrl());
        dto.setUploadDate(report.getUploadDate());
        dto.setCreatedAt(report.getCreatedAt());
        return dto;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public Boolean getIsImage() {
        return isImage;
    }

    public void setIsImage(Boolean image) {
        isImage = image;
    }

    public String getPreviewUrl() {
        return previewUrl;
    }

    public void setPreviewUrl(String previewUrl) {
        this.previewUrl = previewUrl;
    }

    public String getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(String uploadDate) {
        this.uploadDate = uploadDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
