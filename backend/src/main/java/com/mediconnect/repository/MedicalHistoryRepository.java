package com.mediconnect.repository;

import com.mediconnect.entity.MedicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicalHistoryRepository extends JpaRepository<MedicalHistory, String> {
    Optional<MedicalHistory> findByPatientCaseId(String caseId);
    Optional<MedicalHistory> findFirstByPatientCasePatientIdOrderByUpdatedAtDesc(String patientId);
}
