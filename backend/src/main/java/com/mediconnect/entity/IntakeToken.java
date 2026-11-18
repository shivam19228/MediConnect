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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "intake_tokens")
public class IntakeToken {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    @NotBlank
    @Size(max = 50)
    @Column(name = "token_number", length = 50, unique = true, nullable = false)
    private String tokenNumber;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "case_id", unique = true, nullable = false)
    private PatientCase patientCase;

    @NotNull
    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Size(max = 20)
    @Column(name = "day_of_week", length = 20)
    private String dayOfWeek;

    @Size(max = 50)
    @Column(name = "formatted_date", length = 50)
    private String formattedDate;

    @Size(max = 20)
    @Column(name = "formatted_time", length = 20)
    private String formattedTime;

    @NotBlank
    @Size(max = 100)
    @Column(name = "status", length = 100, nullable = false)
    private String status = "Submitted — Awaiting Doctor Review";

    @Column(name = "uploaded_report_count", nullable = false)
    private Integer uploadedReportCount = 0;

    @Size(max = 100)
    @Column(name = "department", length = 100)
    private String department = "General Medicine & Triage";

    @Size(max = 20)
    @Column(name = "locale", length = 20)
    private String locale = "hi-IN";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public IntakeToken() {
    }

    public IntakeToken(String tokenNumber, LocalDateTime submittedAt, String status) {
        this.tokenNumber = tokenNumber;
        this.submittedAt = submittedAt;
        this.status = status;
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
        if (this.submittedAt == null) {
            this.submittedAt = now;
        }
        if (this.uploadedReportCount == null) {
            this.uploadedReportCount = 0;
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

    public String getTokenNumber() {
        return tokenNumber;
    }

    public void setTokenNumber(String tokenNumber) {
        this.tokenNumber = tokenNumber;
    }

    public PatientCase getPatientCase() {
        return patientCase;
    }

    public void setPatientCase(PatientCase patientCase) {
        this.patientCase = patientCase;
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

    public Integer getUploadedReportCount() {
        return uploadedReportCount;
    }

    public void setUploadedReportCount(Integer uploadedReportCount) {
        this.uploadedReportCount = uploadedReportCount;
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
        IntakeToken that = (IntakeToken) o;
        return Objects.equals(tokenNumber, that.tokenNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(tokenNumber);
    }

    @Override
    public String toString() {
        return "IntakeToken{" +
                "id='" + id + '\'' +
                ", tokenNumber='" + tokenNumber + '\'' +
                ", status='" + status + '\'' +
                ", department='" + department + '\'' +
                '}';
    }
}
