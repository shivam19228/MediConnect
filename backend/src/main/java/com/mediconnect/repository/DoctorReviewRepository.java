package com.mediconnect.repository;

import com.mediconnect.entity.DoctorReview;
import com.mediconnect.entity.enums.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorReviewRepository extends JpaRepository<DoctorReview, String> {
    Optional<DoctorReview> findByPatientCaseId(String caseId);
    List<DoctorReview> findByStatus(ReviewStatus status);
}
