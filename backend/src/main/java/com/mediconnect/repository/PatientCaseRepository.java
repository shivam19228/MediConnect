package com.mediconnect.repository;

import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientCaseRepository extends JpaRepository<PatientCase, String>, JpaSpecificationExecutor<PatientCase> {
    List<PatientCase> findByPatientId(String patientId);
    List<PatientCase> findByPatientIdOrderByCreatedAtDesc(String patientId);
    Optional<PatientCase> findByIdAndPatientId(String id, String patientId);
    List<PatientCase> findByIsEmergencyFlagged(Boolean isEmergencyFlagged);
    List<PatientCase> findAllByOrderByCreatedAtDesc();

    @Query("SELECT c FROM PatientCase c LEFT JOIN FETCH c.intakeToken LEFT JOIN FETCH c.doctorReview WHERE c.id = :id")
    Optional<PatientCase> findByIdWithDetails(@Param("id") String id);

    @Query("SELECT COUNT(c) FROM PatientCase c WHERE c.status <> com.mediconnect.entity.enums.CaseStatus.DRAFT")
    long countSubmittedCases();

    @Query("SELECT COUNT(c) FROM PatientCase c LEFT JOIN c.doctorReview r WHERE c.status <> com.mediconnect.entity.enums.CaseStatus.DRAFT AND (c.isEmergencyFlagged = true OR r.status = com.mediconnect.entity.enums.ReviewStatus.URGENT)")
    long countUrgentCases();

    @Query("SELECT COUNT(c) FROM PatientCase c LEFT JOIN c.doctorReview r WHERE c.status <> com.mediconnect.entity.enums.CaseStatus.DRAFT AND r.status = :reviewStatus")
    long countByReviewStatus(@Param("reviewStatus") ReviewStatus reviewStatus);
}
