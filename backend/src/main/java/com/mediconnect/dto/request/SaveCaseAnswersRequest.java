package com.mediconnect.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class SaveCaseAnswersRequest {

    @NotEmpty(message = "Answers list cannot be empty")
    @Valid
    private List<CaseAnswerDto> answers;

    public SaveCaseAnswersRequest() {
    }

    public SaveCaseAnswersRequest(List<CaseAnswerDto> answers) {
        this.answers = answers;
    }

    public List<CaseAnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<CaseAnswerDto> answers) {
        this.answers = answers;
    }
}
