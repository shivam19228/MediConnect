package com.mediconnect.repository;

import com.mediconnect.entity.MedicalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, String> {
    List<MedicalReport> findByPatientCaseId(String caseId);
    List<MedicalReport> findByPatientCaseIdOrderByCreatedAtDesc(String caseId);
    Optional<MedicalReport> findByIdAndPatientCaseId(String id, String caseId);
}
