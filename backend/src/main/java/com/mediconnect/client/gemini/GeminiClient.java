package com.mediconnect.client.gemini;

import com.mediconnect.dto.ai.GeminiPromptContext;
import com.mediconnect.dto.ai.GeminiReportResult;

/**
 * Client interface for Google Gemini AI clinical report generation.
 * Isolated behind this interface to enable mocking in tests without external network calls.
 */
public interface GeminiClient {
    GeminiReportResult generateClinicalSummary(GeminiPromptContext context);
}
