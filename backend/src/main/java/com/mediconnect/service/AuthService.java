package com.mediconnect.service;

import com.mediconnect.dto.request.LoginRequest;
import com.mediconnect.dto.request.RegisterRequest;
import com.mediconnect.dto.response.AuthResponse;
import com.mediconnect.dto.response.UserProfileResponse;
import com.mediconnect.dto.response.UserSummaryDto;
import com.mediconnect.entity.PatientProfile;
import com.mediconnect.entity.Role;
import com.mediconnect.entity.User;
import com.mediconnect.entity.enums.RoleType;
import com.mediconnect.exception.DuplicateResourceException;
import com.mediconnect.exception.ForbiddenException;
import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.repository.RoleRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.security.JwtUtils;
import com.mediconnect.security.UserDetailsImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        // 1. Check for duplicate registration
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new DuplicateResourceException("An account with email " + cleanEmail + " already exists.");
        }

        // 2. Prevent self-registration as ADMIN
        RoleType targetRoleType = request.getRole() != null ? request.getRole() : RoleType.PATIENT;
        if (targetRoleType == RoleType.ADMIN) {
            throw new ForbiddenException("Self-registration as ADMIN is prohibited. Administrative accounts must be provisioned by system administrators.");
        }

        // 3. Resolve role
        Role role = roleRepository.findByName(targetRoleType)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + targetRoleType));

        // 4. Create and populate User entity
        User user = new User();
        user.setEmail(cleanEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone());
        user.setRole(role);
        user.setEnabled(true);

        if (targetRoleType == RoleType.DOCTOR && request.getSpecialty() != null) {
            user.setSpecialty(request.getSpecialty().trim());
        }

        // 5. Initialize PatientProfile for PATIENT role
        if (targetRoleType == RoleType.PATIENT) {
            PatientProfile profile = new PatientProfile();
            profile.setPreferredLanguage("hi");
            user.setPatientProfile(profile);
        }

        User savedUser = userRepository.save(user);

        // 6. Generate JWT token
        String jwtToken = jwtUtils.generateTokenFromUser(savedUser);

        UserSummaryDto summary = new UserSummaryDto(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRole().getName().name(),
                savedUser.getPhone(),
                savedUser.getAvatarUrl(),
                savedUser.getSpecialty()
        );

        return new AuthResponse(jwtToken, jwtUtils.getExpirationMs(), summary);
    }

    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        // 1. Authenticate user credentials
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 2. Generate JWT
        String jwtToken = jwtUtils.generateToken(authentication);
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + cleanEmail));

        UserSummaryDto summary = new UserSummaryDto(
                userPrincipal.getId(),
                userPrincipal.getFullName(),
                userPrincipal.getUsername(),
                userPrincipal.getRole(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.getSpecialty()
        );

        return new AuthResponse(jwtToken, jwtUtils.getExpirationMs(), summary);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return UserProfileResponse.fromEntity(user);
    }
}
