package com.mediconnect.repository;

import com.mediconnect.entity.IntakeToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IntakeTokenRepository extends JpaRepository<IntakeToken, String> {
    Optional<IntakeToken> findByTokenNumber(String tokenNumber);
    boolean existsByTokenNumber(String tokenNumber);
    Optional<IntakeToken> findByPatientCaseId(String caseId);
}
