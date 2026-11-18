package com.mediconnect.dto.ai;

public class GeminiReportResult {

    private StructuredClinicalSummaryDto summary;
    private String modelName;
    private Integer promptTokens;
    private Integer completionTokens;
    private Integer totalTokens;
    private boolean demoGenerated;

    public GeminiReportResult() {
    }

    public GeminiReportResult(StructuredClinicalSummaryDto summary, String modelName, Integer promptTokens, Integer completionTokens, Integer totalTokens) {
        this(summary, modelName, promptTokens, completionTokens, totalTokens, false);
    }

    public GeminiReportResult(StructuredClinicalSummaryDto summary, String modelName, Integer promptTokens, Integer completionTokens, Integer totalTokens, boolean demoGenerated) {
        this.summary = summary;
        this.modelName = modelName;
        this.promptTokens = promptTokens;
        this.completionTokens = completionTokens;
        this.totalTokens = totalTokens;
        this.demoGenerated = demoGenerated;
    }

    public StructuredClinicalSummaryDto getSummary() {
        return summary;
    }

    public void setSummary(StructuredClinicalSummaryDto summary) {
        this.summary = summary;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public Integer getPromptTokens() {
        return promptTokens;
    }

    public void setPromptTokens(Integer promptTokens) {
        this.promptTokens = promptTokens;
    }

    public Integer getCompletionTokens() {
        return completionTokens;
    }

    public void setCompletionTokens(Integer completionTokens) {
        this.completionTokens = completionTokens;
    }

    public Integer getTotalTokens() {
        return totalTokens;
    }

    public void setTotalTokens(Integer totalTokens) {
        this.totalTokens = totalTokens;
    }

    public boolean isDemoGenerated() {
        return demoGenerated;
    }

    public void setDemoGenerated(boolean demoGenerated) {
        this.demoGenerated = demoGenerated;
    }
}
