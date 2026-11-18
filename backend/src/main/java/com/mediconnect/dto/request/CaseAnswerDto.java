package com.mediconnect.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CaseAnswerDto {

    @NotBlank(message = "questionId cannot be blank")
    @Size(max = 100, message = "questionId cannot exceed 100 characters")
    private String questionId;

    @Size(max = 500, message = "questionText cannot exceed 500 characters")
    private String questionText;

    @NotBlank(message = "answer cannot be blank")
    @Size(max = 5000, message = "answer cannot exceed 5000 characters")
    private String answer;

    private Boolean audioUsed = false;

    public CaseAnswerDto() {
    }

    public CaseAnswerDto(String questionId, String questionText, String answer, Boolean audioUsed) {
        this.questionId = questionId;
        this.questionText = questionText;
        this.answer = answer;
        this.audioUsed = audioUsed != null ? audioUsed : false;
    }

    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public Boolean getAudioUsed() {
        return audioUsed;
    }

    public void setAudioUsed(Boolean audioUsed) {
        this.audioUsed = audioUsed;
    }
}
