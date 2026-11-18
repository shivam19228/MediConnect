package com.mediconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.entity.IntakeToken;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class IntakeTokenDto {
    private String tokenNumber;
    private LocalDateTime submittedAt;
    private String dayOfWeek;
    private String formattedDate;
    private String formattedTime;
    private String status;
    private String department;
    private String locale;
    private Integer uploadedReportCount;

    public IntakeTokenDto() {
    }

    public static IntakeTokenDto fromEntity(IntakeToken token) {
        if (token == null) return null;
        IntakeTokenDto dto = new IntakeTokenDto();
        dto.setTokenNumber(token.getTokenNumber());
        dto.setSubmittedAt(token.getSubmittedAt());
        dto.setDayOfWeek(token.getDayOfWeek());
        dto.setFormattedDate(token.getFormattedDate());
        dto.setFormattedTime(token.getFormattedTime());
        dto.setStatus(token.getStatus());
        dto.setDepartment(token.getDepartment());
        dto.setLocale(token.getLocale());
        dto.setUploadedReportCount(token.getUploadedReportCount());
        return dto;
    }

    public String getTokenNumber() {
        return tokenNumber;
    }

    public void setTokenNumber(String tokenNumber) {
        this.tokenNumber = tokenNumber;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getFormattedDate() {
        return formattedDate;
    }

    public void setFormattedDate(String formattedDate) {
        this.formattedDate = formattedDate;
    }

    public String getFormattedTime() {
        return formattedTime;
    }

    public void setFormattedTime(String formattedTime) {
        this.formattedTime = formattedTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public Integer getUploadedReportCount() {
        return uploadedReportCount;
    }

    public void setUploadedReportCount(Integer uploadedReportCount) {
        this.uploadedReportCount = uploadedReportCount;
    }
}
