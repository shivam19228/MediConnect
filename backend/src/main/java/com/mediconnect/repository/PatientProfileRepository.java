package com.mediconnect.repository;

import com.mediconnect.entity.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientProfileRepository extends JpaRepository<PatientProfile, String> {
    Optional<PatientProfile> findByUserId(String userId);
    boolean existsByUserId(String userId);
}
