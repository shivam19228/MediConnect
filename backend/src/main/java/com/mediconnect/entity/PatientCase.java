package com.mediconnect.entity;

import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.SeverityLevel;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "patient_cases")
public class PatientCase {

    @Id
    @Column(name = "id", length = 64, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_user_id")
    private User patient;

    @NotBlank
    @Size(max = 100)
    @Column(name = "patient_name", length = 100, nullable = false)
    private String patientName;

    @Column(name = "patient_age")
    private Integer patientAge;

    @Size(max = 20)
    @Column(name = "patient_gender", length = 20)
    private String patientGender;

    @Size(max = 30)
    @Column(name = "patient_phone", length = 30)
    private String patientPhone;

    @NotBlank
    @Size(max = 10)
    @Column(name = "language", length = 10, nullable = false)
    private String language = "hi";

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20, nullable = false)
    private SeverityLevel severity = SeverityLevel.MODERATE;

    @Size(max = 100)
    @Column(name = "duration", length = 100)
    private String duration;

    @Column(name = "is_emergency_flagged", nullable = false)
    private Boolean isEmergencyFlagged = false;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private CaseStatus status = CaseStatus.DRAFT;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "case_primary_symptoms", joinColumns = @JoinColumn(name = "case_id"))
    @Column(name = "symptom", length = 100)
    private List<String> primarySymptoms = new ArrayList<>();

    @OneToOne(mappedBy = "patientCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private IntakeToken intakeToken;

    @OneToOne(mappedBy = "patientCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private MedicalHistory medicalHistory;

    @OneToMany(mappedBy = "patientCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<CaseAnswer> symptomAnswers = new ArrayList<>();

    @OneToMany(mappedBy = "patientCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<MedicalReport> uploadedReports = new ArrayList<>();

    @OneToOne(mappedBy = "patientCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private GeneratedCaseReport generatedReport;

    @OneToOne(mappedBy = "patientCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private DoctorReview doctorReview;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PatientCase() {
    }

    public PatientCase(String patientName, String language, SeverityLevel severity) {
        this.patientName = patientName;
        this.language = language;
        this.severity = severity;
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
        if (this.isEmergencyFlagged == null) {
            this.isEmergencyFlagged = false;
        }
        if (this.status == null) {
            this.status = CaseStatus.DRAFT;
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

    public User getPatient() {
        return patient;
    }

    public void setPatient(User patient) {
        this.patient = patient;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public Integer getPatientAge() {
        return patientAge;
    }

    public void setPatientAge(Integer patientAge) {
        this.patientAge = patientAge;
    }

    public String getPatientGender() {
        return patientGender;
    }

    public void setPatientGender(String patientGender) {
        this.patientGender = patientGender;
    }

    public String getPatientPhone() {
        return patientPhone;
    }

    public void setPatientPhone(String patientPhone) {
        this.patientPhone = patientPhone;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public SeverityLevel getSeverity() {
        return severity;
    }

    public void setSeverity(SeverityLevel severity) {
        this.severity = severity;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public Boolean getIsEmergencyFlagged() {
        return isEmergencyFlagged;
    }

    public void setIsEmergencyFlagged(Boolean isEmergencyFlagged) {
        this.isEmergencyFlagged = isEmergencyFlagged;
    }

    public CaseStatus getStatus() {
        return status;
    }

    public void setStatus(CaseStatus status) {
        this.status = status;
    }

    public List<String> getPrimarySymptoms() {
        return primarySymptoms;
    }

    public void setPrimarySymptoms(List<String> primarySymptoms) {
        this.primarySymptoms = primarySymptoms;
    }

    public IntakeToken getIntakeToken() {
        return intakeToken;
    }

    public void setIntakeToken(IntakeToken intakeToken) {
        this.intakeToken = intakeToken;
        if (intakeToken != null) {
            intakeToken.setPatientCase(this);
        }
    }

    public MedicalHistory getMedicalHistory() {
        return medicalHistory;
    }

    public void setMedicalHistory(MedicalHistory medicalHistory) {
        this.medicalHistory = medicalHistory;
        if (medicalHistory != null) {
            medicalHistory.setPatientCase(this);
        }
    }

    public List<CaseAnswer> getSymptomAnswers() {
        return symptomAnswers;
    }

    public void setSymptomAnswers(List<CaseAnswer> symptomAnswers) {
        this.symptomAnswers = symptomAnswers;
    }

    public void addSymptomAnswer(CaseAnswer answer) {
        if (this.symptomAnswers == null) {
            this.symptomAnswers = new ArrayList<>();
        }
        this.symptomAnswers.add(answer);
        answer.setPatientCase(this);
    }

    public void removeSymptomAnswer(CaseAnswer answer) {
        if (this.symptomAnswers != null) {
            this.symptomAnswers.remove(answer);
            answer.setPatientCase(null);
        }
    }

    public List<MedicalReport> getUploadedReports() {
        return uploadedReports;
    }

    public void setUploadedReports(List<MedicalReport> uploadedReports) {
        this.uploadedReports = uploadedReports;
    }

    public void addUploadedReport(MedicalReport report) {
        if (this.uploadedReports == null) {
            this.uploadedReports = new ArrayList<>();
        }
        this.uploadedReports.add(report);
        report.setPatientCase(this);
    }

    public void removeUploadedReport(MedicalReport report) {
        if (this.uploadedReports != null) {
            this.uploadedReports.remove(report);
            report.setPatientCase(null);
        }
    }

    public GeneratedCaseReport getGeneratedReport() {
        return generatedReport;
    }

    public void setGeneratedReport(GeneratedCaseReport generatedReport) {
        this.generatedReport = generatedReport;
        if (generatedReport != null) {
            generatedReport.setPatientCase(this);
        }
    }

    public DoctorReview getDoctorReview() {
        return doctorReview;
    }

    public void setDoctorReview(DoctorReview doctorReview) {
        this.doctorReview = doctorReview;
        if (doctorReview != null) {
            doctorReview.setPatientCase(this);
        }
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
        PatientCase that = (PatientCase) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "PatientCase{" +
                "id='" + id + '\'' +
                ", patientName='" + patientName + '\'' +
                ", language='" + language + '\'' +
                ", severity=" + severity +
                ", isEmergencyFlagged=" + isEmergencyFlagged +
                '}';
    }
}
