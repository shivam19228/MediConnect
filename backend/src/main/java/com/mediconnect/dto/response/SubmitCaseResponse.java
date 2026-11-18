package com.mediconnect.dto.response;

import com.mediconnect.entity.enums.CaseStatus;

public class SubmitCaseResponse {
    private String caseId;
    private CaseStatus status;
    private IntakeTokenDto token;
    private String message;

    public SubmitCaseResponse() {
    }

    public SubmitCaseResponse(String caseId, CaseStatus status, IntakeTokenDto token, String message) {
        this.caseId = caseId;
        this.status = status;
        this.token = token;
        this.message = message;
    }

    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
    }

    public CaseStatus getStatus() {
        return status;
    }

    public void setStatus(CaseStatus status) {
        this.status = status;
    }

    public IntakeTokenDto getToken() {
        return token;
    }

    public void setToken(IntakeTokenDto token) {
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
