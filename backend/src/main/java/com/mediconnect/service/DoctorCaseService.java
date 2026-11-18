package com.mediconnect.service;

import com.mediconnect.dto.request.SubmitDoctorReviewRequest;
import com.mediconnect.dto.response.DoctorCaseDetailResponse;
import com.mediconnect.dto.response.DoctorCaseSummaryResponse;
import com.mediconnect.dto.response.DoctorReviewDto;
import com.mediconnect.dto.response.DoctorTriageStatsResponse;
import com.mediconnect.dto.response.PagedResponse;
import com.mediconnect.dto.response.UserSummaryDto;
import com.mediconnect.entity.DoctorReview;
import com.mediconnect.entity.IntakeToken;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.Role;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.ReviewStatus;
import com.mediconnect.entity.enums.RoleType;
import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.repository.DoctorReviewRepository;
import com.mediconnect.repository.PatientCaseRepository;
import com.mediconnect.repository.RoleRepository;
import com.mediconnect.repository.UserRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service providing doctor case review, triage, and queue management.
 *
 * <p><strong>Architectural Note on Doctor Assignment:</strong>
 * In the current domain model, cases are submitted to a shared triage queue rather than
 * assigned upfront to individual doctors (no assigned_doctor_id on patient_cases).
 * Any authorized doctor (ROLE_DOCTOR or ROLE_ADMIN) can inspect unreviewed submitted cases.
 * Once a doctor submits a review, the review is stamped with their identity (doctor_user_id).
 * To prevent conflicts and unauthorized overrides, only the original reviewing doctor or an
 * administrator can modify an existing review.
 */
@Service
@Transactional
public class DoctorCaseService {

    private final PatientCaseRepository patientCaseRepository;
    private final DoctorReviewRepository doctorReviewRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public DoctorCaseService(
            PatientCaseRepository patientCaseRepository,
            DoctorReviewRepository doctorReviewRepository,
            UserRepository userRepository) {
        this(patientCaseRepository, doctorReviewRepository, userRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public DoctorCaseService(
            PatientCaseRepository patientCaseRepository,
            DoctorReviewRepository doctorReviewRepository,
            UserRepository userRepository,
            RoleRepository roleRepository) {
        this.patientCaseRepository = patientCaseRepository;
        this.doctorReviewRepository = doctorReviewRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    /**
     * Lists submitted patient cases for clinical queue review with pagination, triage prioritization,
     * and optional filtering by status, emergency flag, search term, or doctor assignment.
     */
    @Transactional(readOnly = true)
    public PagedResponse<DoctorCaseSummaryResponse> getDoctorCases(
            int page,
            int size,
            ReviewStatus status,
            Boolean urgentOnly,
            String search,
            String sortBy,
            String sortDirection,
            Authentication authentication) {
        return getDoctorCases(page, size, status, urgentOnly, search, sortBy, sortDirection, null, false, authentication);
    }

    /**
     * Lists submitted patient cases with optional doctor assignment filtering.
     */
    @Transactional(readOnly = true)
    public PagedResponse<DoctorCaseSummaryResponse> getDoctorCases(
            int page,
            int size,
            ReviewStatus status,
            Boolean urgentOnly,
            String search,
            String sortBy,
            String sortDirection,
            String assignedDoctorId,
            Boolean assignedToMe,
            Authentication authentication) {

        verifyDoctorOrAdmin(authentication);

        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        if (size > 100) size = 100;

        Sort sort;
        if (sortBy == null || sortBy.isBlank() || "urgent".equalsIgnoreCase(sortBy)) {
            // Prioritize urgent/emergency cases first, then newest submission
            sort = Sort.by(Sort.Order.desc("isEmergencyFlagged"), Sort.Order.desc("createdAt"));
        } else {
            Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
            sort = Sort.by(direction, sortBy);
        }

        Pageable pageable = PageRequest.of(page, size, sort);

        // Build Specification for dynamic filtering
        Specification<PatientCase> spec = (root, query, cb) ->
                cb.notEqual(root.get("status"), CaseStatus.DRAFT);

        if (status != null) {
            spec = spec.and((root, query, cb) -> {
                Join<PatientCase, DoctorReview> reviewJoin = root.join("doctorReview", JoinType.LEFT);
                return cb.equal(reviewJoin.get("status"), status);
            });
        }

        if (Boolean.TRUE.equals(urgentOnly)) {
            spec = spec.and((root, query, cb) -> {
                Join<PatientCase, DoctorReview> reviewJoin = root.join("doctorReview", JoinType.LEFT);
                return cb.or(
                        cb.isTrue(root.get("isEmergencyFlagged")),
                        cb.equal(reviewJoin.get("status"), ReviewStatus.URGENT)
                );
            });
        }

        if (search != null && !search.trim().isEmpty()) {
            String cleanSearch = search.trim().toLowerCase();
            spec = spec.and((root, query, cb) -> {
                Join<PatientCase, IntakeToken> tokenJoin = root.join("intakeToken", JoinType.LEFT);
                return cb.like(cb.lower(tokenJoin.get("tokenNumber")), "%" + cleanSearch + "%");
            });
        }

        if (Boolean.TRUE.equals(assignedToMe)) {
            User currentDoctor = getAuthenticatedUser(authentication);
            spec = spec.and((root, query, cb) -> {
                Join<PatientCase, DoctorReview> reviewJoin = root.join("doctorReview", JoinType.LEFT);
                return cb.equal(reviewJoin.get("reviewedByDoctor").get("id"), currentDoctor.getId());
            });
        } else if (assignedDoctorId != null && !assignedDoctorId.isBlank()) {
            spec = spec.and((root, query, cb) -> {
                Join<PatientCase, DoctorReview> reviewJoin = root.join("doctorReview", JoinType.LEFT);
                return cb.equal(reviewJoin.get("reviewedByDoctor").get("id"), assignedDoctorId.trim());
            });
        }

        Page<PatientCase> casesPage = patientCaseRepository.findAll(spec, pageable);
        Page<DoctorCaseSummaryResponse> dtoPage = casesPage.map(DoctorCaseSummaryResponse::fromEntity);
        return PagedResponse.fromPage(dtoPage);
    }

    /**
     * Retrieves clinical details needed for doctor review.
     * Enforces that draft cases cannot be accessed.
     */
    @Transactional(readOnly = true)
    public DoctorCaseDetailResponse getDoctorCaseDetail(String caseId, Authentication authentication) {
        verifyDoctorOrAdmin(authentication);

        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        if (patientCase.getStatus() == CaseStatus.DRAFT) {
            throw new IllegalStateException("Case is still a draft and has not been submitted by the patient.");
        }

        return DoctorCaseDetailResponse.fromEntity(patientCase);
    }

    /**
     * Creates or updates a DoctorReview associated with the case and authenticated doctor.
     * Enforces status validations and prevents unauthorized review overwrites across doctors.
     */
    public DoctorReviewDto submitOrUpdateReview(
            String caseId,
            SubmitDoctorReviewRequest request,
            Authentication authentication) {

        verifyDoctorOrAdmin(authentication);
        User doctorUser = getAuthenticatedUser(authentication);

        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        if (patientCase.getStatus() == CaseStatus.DRAFT) {
            throw new IllegalStateException("Cannot review a case that is still in draft status.");
        }

        if (request.getStatus() == null) {
            throw new IllegalArgumentException("Review status is required.");
        }

        if (request.getStatus() == ReviewStatus.REVIEWED || request.getStatus() == ReviewStatus.REQUIRES_FOLLOWUP) {
            if (request.getDoctorNotes() == null || request.getDoctorNotes().trim().isEmpty()) {
                throw new IllegalArgumentException("Doctor notes are required when concluding a review or requesting follow-up.");
            }
        }

        DoctorReview review = patientCase.getDoctorReview();
        if (review == null) {
            review = new DoctorReview();
            patientCase.setDoctorReview(review);
        } else if (review.getReviewedByDoctor() != null) {
            User existingReviewer = review.getReviewedByDoctor();
            boolean isSameDoctor = existingReviewer.getId().equals(doctorUser.getId());
            boolean hasAdminRole = isAdmin(authentication);
            if (!isSameDoctor && !hasAdminRole) {
                throw new AccessDeniedException("This review was already completed by Dr. " + existingReviewer.getFullName() +
                        ". Only the original reviewing doctor or an administrator can modify it.");
            }
        }

        ReviewStatus targetStatus = request.getStatus();
        review.setStatus(targetStatus);
        review.setDoctorNotes(request.getDoctorNotes() != null ? request.getDoctorNotes().trim() : null);
        review.setClinicalRecommendations(request.getClinicalRecommendations() != null ? request.getClinicalRecommendations().trim() : null);

        boolean followUp = Boolean.TRUE.equals(request.getFollowUpRequired()) || targetStatus == ReviewStatus.REQUIRES_FOLLOWUP;
        review.setFollowUpRequired(followUp);

        review.setReviewedByDoctor(doctorUser);
        review.setReviewedAt(LocalDateTime.now());

        // Synchronize case status and emergency flag
        if (targetStatus == ReviewStatus.REVIEWED || targetStatus == ReviewStatus.REQUIRES_FOLLOWUP) {
            patientCase.setStatus(CaseStatus.REVIEWED);
        } else if (targetStatus == ReviewStatus.URGENT) {
            patientCase.setIsEmergencyFlagged(true);
        }

        // Update intake token status text
        if (patientCase.getIntakeToken() != null) {
            String reviewerName = doctorUser.getFullName();
            if (targetStatus == ReviewStatus.REVIEWED) {
                patientCase.getIntakeToken().setStatus("Reviewed by Dr. " + reviewerName);
            } else if (targetStatus == ReviewStatus.REQUIRES_FOLLOWUP) {
                patientCase.getIntakeToken().setStatus("Follow-up Required — Dr. " + reviewerName);
            } else if (targetStatus == ReviewStatus.URGENT) {
                patientCase.getIntakeToken().setStatus("Urgent Attention Required — Dr. " + reviewerName);
            }
        }

        PatientCase saved = patientCaseRepository.save(patientCase);
        return DoctorReviewDto.fromEntity(saved.getDoctorReview());
    }

    /**
     * Retrieves real-time triage queue metrics for doctor and admin dashboards.
     */
    @Transactional(readOnly = true)
    public DoctorTriageStatsResponse getTriageStats(Authentication authentication) {
        verifyDoctorOrAdmin(authentication);

        long totalSubmitted = patientCaseRepository.countSubmittedCases();
        long urgentCases = patientCaseRepository.countUrgentCases();
        long pendingReview = patientCaseRepository.countByReviewStatus(ReviewStatus.PENDING_REVIEW);
        long reviewedCases = patientCaseRepository.countByReviewStatus(ReviewStatus.REVIEWED);
        long requiresFollowup = patientCaseRepository.countByReviewStatus(ReviewStatus.REQUIRES_FOLLOWUP);

        return new DoctorTriageStatsResponse(totalSubmitted, pendingReview, urgentCases, reviewedCases, requiresFollowup);
    }

    /**
     * Returns a list of all active registered doctors for administrative assignment.
     */
    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAvailableDoctors() {
        Role doctorRole = roleRepository != null ? roleRepository.findByName(RoleType.DOCTOR).orElse(null) : null;
        List<User> doctors = (doctorRole != null)
                ? userRepository.findByRole(doctorRole)
                : userRepository.findAll().stream().filter(u -> u.getRole() != null && u.getRole().getName() == RoleType.DOCTOR).toList();

        return doctors.stream()
                .filter(User::isEnabled)
                .map(u -> new UserSummaryDto(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getRole().getName().name(),
                        u.getPhone(),
                        u.getAvatarUrl(),
                        u.getSpecialty()
                ))
                .toList();
    }

    /**
     * Assigns or reassigns an eligible patient case to a doctor.
     * Accessible only by administrators (ROLE_ADMIN).
     */
    public DoctorCaseSummaryResponse assignDoctorToCase(String caseId, String targetDoctorId, Authentication authentication) {
        verifyAdmin(authentication);

        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        if (patientCase.getStatus() == CaseStatus.DRAFT) {
            throw new IllegalStateException("Cannot assign a doctor to a draft case. The case must be submitted first.");
        }

        User assignedDoctor = null;
        if (targetDoctorId != null && !targetDoctorId.isBlank()) {
            assignedDoctor = userRepository.findById(targetDoctorId.trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor user not found with id: " + targetDoctorId));

            if (assignedDoctor.getRole() == null ||
                    (assignedDoctor.getRole().getName() != RoleType.DOCTOR && assignedDoctor.getRole().getName() != RoleType.ADMIN)) {
                throw new IllegalArgumentException("Target user is not registered with role DOCTOR or ADMIN.");
            }
            if (!assignedDoctor.isEnabled()) {
                throw new IllegalStateException("Selected doctor account is currently disabled.");
            }
        }

        DoctorReview review = patientCase.getDoctorReview();
        if (review == null) {
            review = new DoctorReview();
            review.setStatus(ReviewStatus.PENDING_REVIEW);
            review.setFollowUpRequired(false);
            patientCase.setDoctorReview(review);
        }

        review.setReviewedByDoctor(assignedDoctor);

        IntakeToken token = patientCase.getIntakeToken();
        if (token != null) {
            if (assignedDoctor != null) {
                token.setStatus("Assigned to Dr. " + assignedDoctor.getFullName());
            } else {
                token.setStatus("Submitted — Awaiting Doctor Review");
            }
        }

        PatientCase saved = patientCaseRepository.save(patientCase);
        return DoctorCaseSummaryResponse.fromEntity(saved);
    }

    private void verifyAdmin(Authentication authentication) {
        if (!isAdmin(authentication)) {
            throw new AccessDeniedException("Access denied: doctor assignment requires administrative privileges (ROLE_ADMIN).");
        }
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BadCredentialsException("User is not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private void verifyDoctorOrAdmin(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentication required to access doctor endpoints");
        }
        boolean hasRole = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_DOCTOR") || role.equals("ROLE_ADMIN"));
        if (!hasRole) {
            throw new AccessDeniedException("Access denied: only medical staff or administrators can access this resource");
        }
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));
    }
}
