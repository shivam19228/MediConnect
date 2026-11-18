package com.mediconnect.client.gemini;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.dto.ai.GeminiPromptContext;
import com.mediconnect.dto.ai.GeminiReportResult;
import com.mediconnect.dto.request.CaseAnswerDto;
import com.mediconnect.dto.request.MedicalHistoryDto;
import com.mediconnect.entity.enums.SeverityLevel;
import com.mediconnect.exception.GeminiConfigurationException;
import com.mediconnect.exception.GeminiServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeminiClientImplTest {

    private static class StubRestTemplate extends RestTemplate {
        ResponseEntity<String> responseToReturn;
        RuntimeException exceptionToThrow;
        String capturedUrl;
        HttpEntity<?> capturedEntity;

        @Override
        @SuppressWarnings("unchecked")
        public <T> ResponseEntity<T> exchange(String url, HttpMethod method, HttpEntity<?> requestEntity, Class<T> responseType, Object... uriVariables) {
            this.capturedUrl = url;
            this.capturedEntity = requestEntity;
            if (exceptionToThrow != null) {
                throw exceptionToThrow;
            }
            return (ResponseEntity<T>) responseToReturn;
        }
    }

    private StubRestTemplate restTemplate;
    private ObjectMapper objectMapper;
    private GeminiClientImpl geminiClient;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        restTemplate = new StubRestTemplate();
        geminiClient = new GeminiClientImpl(objectMapper, restTemplate);
        ReflectionTestUtils.setField(geminiClient, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(geminiClient, "model", "gemini-3.5-flash");
        ReflectionTestUtils.setField(geminiClient, "baseUrl", "https://generativelanguage.googleapis.com/v1beta");
        ReflectionTestUtils.setField(geminiClient, "timeoutSeconds", 30);
    }

    private GeminiPromptContext createSampleContext() {
        return new GeminiPromptContext(
                "case-123",
                45,
                "Male",
                "en",
                List.of("chest_pain", "shortness_of_breath"),
                SeverityLevel.SEVERE,
                "2 hours",
                true,
                List.of(new CaseAnswerDto("Q1", "Onset of pain?", "Sudden onset while walking", false)),
                new MedicalHistoryDto("Hypertension", "Amlodipine", "None", "None", "Father had CAD", true),
                List.of("ecg_trace.pdf")
        );
    }

    @Test
    @DisplayName("When API key is unavailable, provides an explicitly labelled demo mode for college presentation")
    void testMissingApiKey_GeneratesExplicitlyLabelledDemoReport() {
        ReflectionTestUtils.setField(geminiClient, "apiKey", "");
        GeminiPromptContext context = createSampleContext();

        GeminiReportResult result = geminiClient.generateClinicalSummary(context);
        assertThat(result).isNotNull();
        assertThat(result.isDemoGenerated()).isTrue();
        assertThat(result.getModelName()).isEqualTo("Offline Demo Synthesizer (College Presentation Mode)");
        assertThat(result.getSummary().getChiefComplaint()).contains("chest_pain");
        assertThat(result.getSummary().getItemsRequiringDoctorReview()).isNotBlank();
    }

    @Test
    @DisplayName("Successfully parses structured JSON response from Gemini API")
    void testGenerateClinicalSummary_Success() {
        String geminiJson = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "{\\"chiefComplaint\\":\\"Acute substernal chest discomfort\\",\\"historyOfPresentIllness\\":\\"Patient reports acute onset of chest pain 2 hours ago with radiation.\\",\\"symptomDurationAndSeverity\\":\\"Duration 2 hours, severe intensity\\",\\"associatedSymptoms\\":\\"Shortness of breath, diaphoresis\\",\\"relevantMedicalHistory\\":\\"Pre-existing hypertension\\",\\"currentMedicines\\":\\"Amlodipine\\",\\"knownAllergies\\":\\"None reported\\",\\"previousMedicalReports\\":\\"ecg_trace.pdf attached\\",\\"patientReportedInformation\\":\\"Sudden onset while walking\\",\\"missingOrUnansweredInfo\\":\\"Vital signs (BP, SpO2) and serial troponins not recorded\\",\\"itemsRequiringDoctorReview\\":\\"Immediate 12-lead ECG and cardiac enzymatic markers\\"}"
                          }
                        ],
                        "role": "model"
                      },
                      "finishReason": "STOP"
                    }
                  ],
                  "usageMetadata": {
                    "promptTokenCount": 320,
                    "candidatesTokenCount": 140,
                    "totalTokenCount": 460
                  }
                }
                """;

        restTemplate.responseToReturn = new ResponseEntity<>(geminiJson, HttpStatus.OK);

        GeminiPromptContext context = createSampleContext();
        GeminiReportResult result = geminiClient.generateClinicalSummary(context);

        assertThat(result).isNotNull();
        assertThat(result.getModelName()).isEqualTo("gemini-3.5-flash");
        assertThat(result.getPromptTokens()).isEqualTo(320);
        assertThat(result.getCompletionTokens()).isEqualTo(140);
        assertThat(result.getTotalTokens()).isEqualTo(460);

        assertThat(result.getSummary()).isNotNull();
        assertThat(result.getSummary().getChiefComplaint()).isEqualTo("Acute substernal chest discomfort");
        assertThat(result.getSummary().getHistoryOfPresentIllness()).contains("2 hours ago");
        assertThat(result.getSummary().getItemsRequiringDoctorReview()).contains("12-lead ECG");
    }

    @Test
    @DisplayName("Throws GeminiServiceException when provider returns 429 Too Many Requests")
    void testRateLimit_ThrowsServiceException() {
        restTemplate.exceptionToThrow = new HttpClientErrorException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");

        GeminiPromptContext context = createSampleContext();

        assertThatThrownBy(() -> geminiClient.generateClinicalSummary(context))
                .isInstanceOf(GeminiServiceException.class)
                .hasMessageContaining("rate limit reached");
    }

    @Test
    @DisplayName("Throws GeminiServiceException when provider returns 500 Internal Server Error")
    void testServerError_ThrowsServiceException() {
        restTemplate.exceptionToThrow = new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Google API Internal Error");

        GeminiPromptContext context = createSampleContext();

        assertThatThrownBy(() -> geminiClient.generateClinicalSummary(context))
                .isInstanceOf(GeminiServiceException.class)
                .hasMessageContaining("currently unavailable");
    }

    @Test
    @DisplayName("Throws GeminiServiceException on connection timeout")
    void testConnectionTimeout_ThrowsServiceException() {
        restTemplate.exceptionToThrow = new ResourceAccessException("Connection timed out");

        GeminiPromptContext context = createSampleContext();

        assertThatThrownBy(() -> geminiClient.generateClinicalSummary(context))
                .isInstanceOf(GeminiServiceException.class)
                .hasMessageContaining("timed out or network connection failed");
    }

    @Test
    @DisplayName("Throws GeminiServiceException when response contains malformed JSON text")
    void testMalformedJson_ThrowsServiceException() {
        String malformedJson = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "This is not valid JSON output from the model"
                          }
                        ]
                      }
                    }
                  ]
                }
                """;

        restTemplate.responseToReturn = new ResponseEntity<>(malformedJson, HttpStatus.OK);

        GeminiPromptContext context = createSampleContext();

        assertThatThrownBy(() -> geminiClient.generateClinicalSummary(context))
                .isInstanceOf(GeminiServiceException.class)
                .hasMessageContaining("Failed to parse structured clinical report");
    }

    @Test
    @DisplayName("Throws GeminiServiceException when response has empty candidates")
    void testEmptyCandidates_ThrowsServiceException() {
        String emptyCandidatesJson = """
                {
                  "candidates": []
                }
                """;

        restTemplate.responseToReturn = new ResponseEntity<>(emptyCandidatesJson, HttpStatus.OK);

        GeminiPromptContext context = createSampleContext();

        assertThatThrownBy(() -> geminiClient.generateClinicalSummary(context))
                .isInstanceOf(GeminiServiceException.class)
                .hasMessageContaining("no content candidates");
    }

    @Test
    @DisplayName("Sends request with x-goog-api-key header and without exposing key in URL")
    void testGenerateClinicalSummary_UsesHeader() {
        String geminiJson = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          {
                            "text": "{\\"chiefComplaint\\":\\"Chest discomfort\\"}"
                          }
                        ],
                        "role": "model"
                      }
                    }
                  ]
                }
                """;

        restTemplate.responseToReturn = new ResponseEntity<>(geminiJson, HttpStatus.OK);

        GeminiPromptContext context = createSampleContext();
        geminiClient.generateClinicalSummary(context);

        assertThat(restTemplate.capturedUrl).doesNotContain("test-api-key");
        assertThat(restTemplate.capturedUrl).isEqualTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent");
        assertThat(restTemplate.capturedEntity.getHeaders().getFirst("x-goog-api-key")).isEqualTo("test-api-key");
    }

    @Test
    @DisplayName("resolveSupportedModel correctly redirects obsolete models to verified gemini-3.5-flash")
    void testResolveSupportedModel_RedirectsObsoleteModels() {
        assertThat(geminiClient.resolveSupportedModel(null)).isEqualTo("gemini-3.5-flash");
        assertThat(geminiClient.resolveSupportedModel("")).isEqualTo("gemini-3.5-flash");
        assertThat(geminiClient.resolveSupportedModel("gemini-1.5-flash")).isEqualTo("gemini-3.5-flash");
        assertThat(geminiClient.resolveSupportedModel("gemini-1.5-pro")).isEqualTo("gemini-3.5-flash");
        assertThat(geminiClient.resolveSupportedModel("gemini-2.5-flash")).isEqualTo("gemini-3.5-flash");
        assertThat(geminiClient.resolveSupportedModel("models/gemini-3.5-flash")).isEqualTo("gemini-3.5-flash");
    }

    @Test
    @DisplayName("Throws GeminiConfigurationException when provider returns 400 with invalid API key message")
    void testGenerateClinicalSummary_InvalidApiKey_ThrowsConfigurationException() {
        String errorJson = """
                {
                  "error": {
                    "code": 400,
                    "message": "API key not valid. Please pass a valid API key.",
                    "status": "INVALID_ARGUMENT"
                  }
                }
                """;

        HttpClientErrorException clientException = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                org.springframework.http.HttpHeaders.EMPTY,
                errorJson.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                java.nio.charset.StandardCharsets.UTF_8
        );

        restTemplate.exceptionToThrow = clientException;

        GeminiPromptContext context = createSampleContext();

        assertThatThrownBy(() -> geminiClient.generateClinicalSummary(context))
                .isInstanceOf(GeminiConfigurationException.class)
                .hasMessageContaining("Gemini AI API key is invalid")
                .hasMessageContaining("API key not valid");
    }
}
