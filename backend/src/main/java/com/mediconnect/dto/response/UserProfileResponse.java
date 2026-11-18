package com.mediconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mediconnect.entity.User;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserProfileResponse {
    private String id;
    private String email;
    private String fullName;
    private String role;
    private String phone;
    private String avatarUrl;
    private String specialty;
    private PatientProfileDto patientProfile;
    private LocalDateTime createdAt;

    public UserProfileResponse() {
    }

    public static UserProfileResponse fromEntity(User user) {
        if (user == null) return null;
        UserProfileResponse res = new UserProfileResponse();
        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setFullName(user.getFullName());
        res.setRole(user.getRole().getName().name());
        res.setPhone(user.getPhone());
        res.setAvatarUrl(user.getAvatarUrl());
        res.setSpecialty(user.getSpecialty());
        if (user.getPatientProfile() != null) {
            res.setPatientProfile(PatientProfileDto.fromEntity(user.getPatientProfile()));
        }
        res.setCreatedAt(user.getCreatedAt());
        return res;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public PatientProfileDto getPatientProfile() {
        return patientProfile;
    }

    public void setPatientProfile(PatientProfileDto patientProfile) {
        this.patientProfile = patientProfile;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
