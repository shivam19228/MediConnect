package com.mediconnect.repository;

import com.mediconnect.entity.GeneratedCaseReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GeneratedCaseReportRepository extends JpaRepository<GeneratedCaseReport, String> {
    Optional<GeneratedCaseReport> findByPatientCaseId(String caseId);
}
