package com.mediconnect.dto.request;

import jakarta.validation.constraints.Size;

public class AssignDoctorRequest {

    @Size(max = 64, message = "Doctor user ID must not exceed 64 characters")
    private String doctorId;

    public AssignDoctorRequest() {
    }

    public AssignDoctorRequest(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }
}

