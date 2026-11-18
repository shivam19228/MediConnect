package com.mediconnect.service;

import com.mediconnect.dto.request.CaseAnswerDto;
import com.mediconnect.dto.request.CreateCaseDraftRequest;
import com.mediconnect.dto.request.MedicalHistoryDto;
import com.mediconnect.dto.request.SaveCaseAnswersRequest;
import com.mediconnect.dto.request.UpdateCaseDraftRequest;
import com.mediconnect.dto.response.CaseDetailResponse;
import com.mediconnect.dto.response.CaseSummaryResponse;
import com.mediconnect.dto.response.IntakeTokenDto;
import com.mediconnect.dto.response.SubmitCaseResponse;
import com.mediconnect.entity.CaseAnswer;
import com.mediconnect.entity.DoctorReview;
import com.mediconnect.entity.IntakeToken;
import com.mediconnect.entity.MedicalHistory;
import com.mediconnect.entity.PatientCase;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.CaseStatus;
import com.mediconnect.entity.enums.ReviewStatus;
import com.mediconnect.entity.enums.RoleType;
import com.mediconnect.entity.enums.SeverityLevel;
import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.repository.MedicalHistoryRepository;
import com.mediconnect.repository.PatientCaseRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.security.UserDetailsImpl;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class PatientCaseService {

    private final PatientCaseRepository patientCaseRepository;
    private final MedicalHistoryRepository medicalHistoryRepository;
    private final UserRepository userRepository;
    private final TokenGenerationService tokenGenerationService;

    public PatientCaseService(
            PatientCaseRepository patientCaseRepository,
            MedicalHistoryRepository medicalHistoryRepository,
            UserRepository userRepository,
            TokenGenerationService tokenGenerationService) {
        this.patientCaseRepository = patientCaseRepository;
        this.medicalHistoryRepository = medicalHistoryRepository;
        this.userRepository = userRepository;
        this.tokenGenerationService = tokenGenerationService;
    }

    @Transactional
    public CaseDetailResponse createCaseDraft(CreateCaseDraftRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);

        PatientCase patientCase = new PatientCase();
        patientCase.setPatient(user);

        // Demographics: fallback to patient profile / user details
        if (request.getPatientName() != null && !request.getPatientName().isBlank()) {
            patientCase.setPatientName(request.getPatientName().trim());
        } else {
            patientCase.setPatientName(user.getFullName());
        }

        if (request.getPatientAge() != null) {
            patientCase.setPatientAge(request.getPatientAge());
        } else if (user.getPatientProfile() != null) {
            patientCase.setPatientAge(user.getPatientProfile().getAge());
        }

        if (request.getPatientGender() != null && !request.getPatientGender().isBlank()) {
            patientCase.setPatientGender(request.getPatientGender().trim());
        } else if (user.getPatientProfile() != null) {
            patientCase.setPatientGender(user.getPatientProfile().getGender());
        }

        if (request.getPatientPhone() != null && !request.getPatientPhone().isBlank()) {
            patientCase.setPatientPhone(request.getPatientPhone().trim());
        } else {
            patientCase.setPatientPhone(user.getPhone());
        }

        patientCase.setLanguage(request.getLanguage() != null && !request.getLanguage().isBlank() ? request.getLanguage().trim() : "hi");
        patientCase.setSeverity(request.getSeverity() != null ? request.getSeverity() : SeverityLevel.MODERATE);
        patientCase.setDuration(request.getDuration());
        patientCase.setStatus(CaseStatus.DRAFT);

        if (request.getPrimarySymptoms() != null) {
            patientCase.setPrimarySymptoms(new ArrayList<>(request.getPrimarySymptoms()));
        }

        boolean isEmergency = Boolean.TRUE.equals(request.getIsEmergencyFlagged()) ||
                (patientCase.getPrimarySymptoms() != null && (
                        patientCase.getPrimarySymptoms().contains("chest_discomfort") ||
                                patientCase.getPrimarySymptoms().contains("breathing_difficulty")));
        patientCase.setIsEmergencyFlagged(isEmergency);

        PatientCase saved = patientCaseRepository.save(patientCase);
        return CaseDetailResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<CaseSummaryResponse> getMyCases(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return patientCaseRepository.findByPatientIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(CaseSummaryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public CaseDetailResponse getCaseById(String caseId, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseAccess(patientCase, authentication);
        return CaseDetailResponse.fromEntity(patientCase);
    }

    @Transactional
    public CaseDetailResponse updateCaseDraft(String caseId, UpdateCaseDraftRequest request, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseOwnership(patientCase, authentication);
        verifyCaseIsEditable(patientCase);

        if (request.getPatientName() != null && !request.getPatientName().isBlank()) {
            patientCase.setPatientName(request.getPatientName().trim());
        }
        if (request.getPatientAge() != null) {
            patientCase.setPatientAge(request.getPatientAge());
        }
        if (request.getPatientGender() != null) {
            patientCase.setPatientGender(request.getPatientGender().trim());
        }
        if (request.getPatientPhone() != null) {
            patientCase.setPatientPhone(request.getPatientPhone().trim());
        }
        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            patientCase.setLanguage(request.getLanguage().trim());
        }
        if (request.getSeverity() != null) {
            patientCase.setSeverity(request.getSeverity());
        }
        if (request.getDuration() != null) {
            patientCase.setDuration(request.getDuration().trim());
        }
        if (request.getPrimarySymptoms() != null) {
            patientCase.setPrimarySymptoms(new ArrayList<>(request.getPrimarySymptoms()));
        }

        boolean isEmergency = Boolean.TRUE.equals(request.getIsEmergencyFlagged()) ||
                (patientCase.getPrimarySymptoms() != null && (
                        patientCase.getPrimarySymptoms().contains("chest_discomfort") ||
                                patientCase.getPrimarySymptoms().contains("breathing_difficulty")));
        patientCase.setIsEmergencyFlagged(isEmergency);

        PatientCase saved = patientCaseRepository.save(patientCase);
        return CaseDetailResponse.fromEntity(saved);
    }

    @Transactional
    public CaseDetailResponse saveCaseAnswers(String caseId, SaveCaseAnswersRequest request, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseOwnership(patientCase, authentication);
        verifyCaseIsEditable(patientCase);

        for (CaseAnswerDto dto : request.getAnswers()) {
            CaseAnswer existing = patientCase.getSymptomAnswers().stream()
                    .filter(a -> a.getQuestionId().equals(dto.getQuestionId()))
                    .findFirst()
                    .orElse(null);

            if (existing != null) {
                existing.setAnswer(dto.getAnswer());
                existing.setQuestionText(dto.getQuestionText());
                existing.setAudioUsed(dto.getAudioUsed() != null ? dto.getAudioUsed() : false);
            } else {
                CaseAnswer newAnswer = new CaseAnswer(
                        dto.getQuestionId(),
                        dto.getQuestionText(),
                        dto.getAnswer(),
                        dto.getAudioUsed()
                );
                patientCase.addSymptomAnswer(newAnswer);
            }
        }

        PatientCase saved = patientCaseRepository.save(patientCase);
        return CaseDetailResponse.fromEntity(saved);
    }

    @Transactional
    public MedicalHistoryDto updateMedicalHistory(String caseId, MedicalHistoryDto request, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseOwnership(patientCase, authentication);
        verifyCaseIsEditable(patientCase);

        MedicalHistory history = patientCase.getMedicalHistory();
        if (history == null) {
            history = new MedicalHistory();
            patientCase.setMedicalHistory(history);
        }

        history.setConditions(request.getConditions());
        history.setMedications(request.getMedications());
        history.setAllergies(request.getAllergies());
        history.setPastSurgeries(request.getPastSurgeries());
        history.setFamilyHistory(request.getFamilyHistory());
        history.setProvided(Boolean.TRUE.equals(request.getProvided()));

        patientCaseRepository.save(patientCase);
        return MedicalHistoryDto.fromEntity(history);
    }

    @Transactional(readOnly = true)
    public MedicalHistoryDto getMedicalHistory(String caseId, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseAccess(patientCase, authentication);

        if (patientCase.getMedicalHistory() != null) {
            return MedicalHistoryDto.fromEntity(patientCase.getMedicalHistory());
        }

        // Check if patient has any previous medical history to pre-populate
        if (patientCase.getPatient() != null) {
            return medicalHistoryRepository.findFirstByPatientCasePatientIdOrderByUpdatedAtDesc(patientCase.getPatient().getId())
                    .map(MedicalHistoryDto::fromEntity)
                    .orElseGet(MedicalHistoryDto::new);
        }

        return new MedicalHistoryDto();
    }

    @Transactional(readOnly = true)
    public MedicalHistoryDto getPatientLatestMedicalHistory(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return medicalHistoryRepository.findFirstByPatientCasePatientIdOrderByUpdatedAtDesc(user.getId())
                .map(MedicalHistoryDto::fromEntity)
                .orElseGet(MedicalHistoryDto::new);
    }

    @Transactional
    public SubmitCaseResponse submitCase(String caseId, Authentication authentication) {
        PatientCase patientCase = patientCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient case not found with id: " + caseId));

        verifyCaseOwnership(patientCase, authentication);

        if (patientCase.getStatus() != CaseStatus.DRAFT) {
            String existingToken = patientCase.getIntakeToken() != null ? patientCase.getIntakeToken().getTokenNumber() : "";
            throw new IllegalStateException("Case has already been submitted and cannot be resubmitted. Existing token: " + existingToken);
        }

        // Validation for submission
        if (patientCase.getPrimarySymptoms() == null || patientCase.getPrimarySymptoms().isEmpty()) {
            throw new IllegalArgumentException("At least one primary symptom is required to submit a case.");
        }
        if (patientCase.getDuration() == null || patientCase.getDuration().isBlank()) {
            throw new IllegalArgumentException("Symptom duration is required to submit a case.");
        }
        if (patientCase.getSeverity() == null) {
            throw new IllegalArgumentException("Severity level is required to submit a case.");
        }

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        // Safe atomic sequential token generation
        String tokenNumber = tokenGenerationService.generateNextTokenNumber(today);

        IntakeToken intakeToken = new IntakeToken();
        intakeToken.setTokenNumber(tokenNumber);
        intakeToken.setSubmittedAt(now);
        intakeToken.setDayOfWeek(now.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH));
        intakeToken.setFormattedDate(now.format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH)));
        intakeToken.setFormattedTime(now.format(DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH)));
        intakeToken.setStatus("Submitted — Awaiting Doctor Review");
        intakeToken.setDepartment("General Medicine & Triage");
        intakeToken.setLocale(patientCase.getLanguage() != null ? patientCase.getLanguage() + "-IN" : "hi-IN");
        intakeToken.setUploadedReportCount(patientCase.getUploadedReports() != null ? patientCase.getUploadedReports().size() : 0);
        patientCase.setIntakeToken(intakeToken);

        boolean isEmergency = Boolean.TRUE.equals(patientCase.getIsEmergencyFlagged()) ||
                patientCase.getPrimarySymptoms().contains("chest_discomfort") ||
                patientCase.getPrimarySymptoms().contains("breathing_difficulty");
        patientCase.setIsEmergencyFlagged(isEmergency);

        DoctorReview review = new DoctorReview();
        review.setStatus(isEmergency ? ReviewStatus.URGENT : ReviewStatus.PENDING_REVIEW);
        review.setDoctorNotes("");
        review.setFollowUpRequired(false);
        patientCase.setDoctorReview(review);

        patientCase.setStatus(CaseStatus.SUBMITTED);
        PatientCase saved = patientCaseRepository.save(patientCase);

        return new SubmitCaseResponse(
                saved.getId(),
                saved.getStatus(),
                IntakeTokenDto.fromEntity(saved.getIntakeToken()),
                "Case successfully submitted and assigned queue token"
        );
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName().trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private void verifyCaseAccess(PatientCase patientCase, Authentication authentication) {
        UserDetailsImpl caller = (UserDetailsImpl) authentication.getPrincipal();

        if (caller.getRole().equals(RoleType.PATIENT.name())) {
            if (patientCase.getPatient() == null || !patientCase.getPatient().getId().equals(caller.getId())) {
                throw new AccessDeniedException("Access is denied: You are not authorized to access another patient's medical case.");
            }
        }
    }

    private void verifyCaseOwnership(PatientCase patientCase, Authentication authentication) {
        UserDetailsImpl caller = (UserDetailsImpl) authentication.getPrincipal();

        if (patientCase.getPatient() == null || !patientCase.getPatient().getId().equals(caller.getId())) {
            throw new AccessDeniedException("Access is denied: You are not authorized to modify another patient's medical case.");
        }
    }

    private void verifyCaseIsEditable(PatientCase patientCase) {
        if (patientCase.getStatus() != CaseStatus.DRAFT) {
            throw new IllegalStateException("Case is in status '" + patientCase.getStatus() + "' and cannot be modified. Only DRAFT cases can be updated.");
        }
    }
}
