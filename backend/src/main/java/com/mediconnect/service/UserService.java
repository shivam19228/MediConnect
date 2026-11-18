package com.mediconnect.service;

import com.mediconnect.dto.request.UpdatePatientProfileRequest;
import com.mediconnect.dto.response.UserProfileResponse;
import com.mediconnect.entity.PatientProfile;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.RoleType;
import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.repository.PatientProfileRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.security.UserDetailsImpl;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;

    public UserService(UserRepository userRepository, PatientProfileRepository patientProfileRepository) {
        this.userRepository = userRepository;
        this.patientProfileRepository = patientProfileRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String targetUserId, Authentication authentication) {
        UserDetailsImpl caller = (UserDetailsImpl) authentication.getPrincipal();

        // Enforce patient privacy: PATIENT users can only access their own records
        if (caller.getRole().equals(RoleType.PATIENT.name()) && !caller.getId().equals(targetUserId)) {
            throw new AccessDeniedException("Access is denied: Patients are only permitted to view their own private medical records.");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        return UserProfileResponse.fromEntity(user);
    }

    @Transactional
    public UserProfileResponse updatePatientProfile(
            String targetUserId, UpdatePatientProfileRequest request, Authentication authentication) {
        UserDetailsImpl caller = (UserDetailsImpl) authentication.getPrincipal();

        // Enforce patient privacy: PATIENT users can only update their own records
        if (caller.getRole().equals(RoleType.PATIENT.name()) && !caller.getId().equals(targetUserId)) {
            throw new AccessDeniedException("Access is denied: Patients are only permitted to modify their own private medical records.");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        PatientProfile profile = user.getPatientProfile();
        if (profile == null) {
            profile = new PatientProfile(user);
            user.setPatientProfile(profile);
        }

        if (request.getAge() != null) profile.setAge(request.getAge());
        if (request.getGender() != null) profile.setGender(request.getGender());
        if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
        if (request.getBloodGroup() != null) profile.setBloodGroup(request.getBloodGroup());
        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getEmergencyContactName() != null) profile.setEmergencyContactName(request.getEmergencyContactName());
        if (request.getEmergencyContactPhone() != null) profile.setEmergencyContactPhone(request.getEmergencyContactPhone());
        if (request.getPreferredLanguage() != null) profile.setPreferredLanguage(request.getPreferredLanguage());

        User updated = userRepository.save(user);
        return UserProfileResponse.fromEntity(updated);
    }

    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllPatients() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole().getName() == RoleType.PATIENT)
                .map(UserProfileResponse::fromEntity)
                .toList();
    }
}
