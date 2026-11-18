package com.mediconnect.client.gemini;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediconnect.dto.ai.GeminiPromptContext;
import com.mediconnect.dto.ai.GeminiReportResult;
import com.mediconnect.dto.ai.ProcessedDocumentContent;
import com.mediconnect.dto.ai.StructuredClinicalSummaryDto;
import com.mediconnect.dto.request.CaseAnswerDto;
import com.mediconnect.dto.request.MedicalHistoryDto;
import com.mediconnect.exception.GeminiConfigurationException;
import com.mediconnect.exception.GeminiServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Production implementation of GeminiClient calling Google Gemini REST API.
 * Uses structured JSON generation mode (responseMimeType: application/json)
 * and multimodal parts for attached medical reports (PDF documents and images).
 * When GEMINI_API_KEY is absent, provides an explicitly labelled offline demo synthesizer
 * to guarantee robust demonstration without unhandled cloud exceptions.
 */
@Component
public class GeminiClientImpl implements GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClientImpl.class);

    public static final String DEFAULT_SUPPORTED_MODEL = "gemini-3.5-flash";
    public static final String FALLBACK_SUPPORTED_MODEL = "gemini-3.5-flash-lite";

    @Value("${mediconnect.gemini.api-key:}")
    private String apiKey;

    @Value("${mediconnect.gemini.model:gemini-3.5-flash}")
    private String model;

    @Value("${mediconnect.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    @Value("${mediconnect.gemini.timeout-seconds:30}")
    private int timeoutSeconds;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Autowired
    public GeminiClientImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);
        factory.setReadTimeout(60000);
        this.restTemplate.setRequestFactory(factory);
    }

    public GeminiClientImpl(ObjectMapper objectMapper, RestTemplate restTemplate) {
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    public String resolveSupportedModel(String configuredModel) {
        if (configuredModel == null || configuredModel.isBlank()) {
            return DEFAULT_SUPPORTED_MODEL;
        }
        String clean = configuredModel.trim();
        if (clean.startsWith("models/")) {
            clean = clean.substring("models/".length());
        }
        if (clean.equalsIgnoreCase("gemini-1.5-flash") ||
                clean.equalsIgnoreCase("gemini-1.5-pro") ||
                clean.equalsIgnoreCase("gemini-2.5-flash") ||
                clean.equalsIgnoreCase("gemini-2.5-flash-lite")) {
            log.warn("Configured Gemini model '{}' is deprecated or unsupported for new API calls. Automatically redirecting to '{}'",
                    configuredModel, DEFAULT_SUPPORTED_MODEL);
            return DEFAULT_SUPPORTED_MODEL;
        }
        return clean;
    }

    @Override
    public GeminiReportResult generateClinicalSummary(GeminiPromptContext context) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.info("GEMINI_API_KEY is not configured. Activating explicitly labelled College Demo Synthesizer mode for case id: {}", context.getCaseId());
            return generateOfflineDemoReport(context);
        }

        String activeModel = resolveSupportedModel(this.model);
        try {
            return executeGenerateContent(context, activeModel);
        } catch (HttpStatusCodeException ex) {
            String errorDetail = extractGeminiErrorMessage(ex);
            log.error("Gemini AI API returned error status [{}]: {}", ex.getStatusCode(), errorDetail);

            // If primary model failed with 404 (model not found) or 503 (temporary demand spike), attempt fallback
            if ((ex.getStatusCode() == HttpStatus.NOT_FOUND || ex.getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE)
                    && !activeModel.equalsIgnoreCase(FALLBACK_SUPPORTED_MODEL)) {
                log.warn("Gemini call for model '{}' failed (status: {}). Attempting fallback model '{}'",
                        activeModel, ex.getStatusCode(), FALLBACK_SUPPORTED_MODEL);
                try {
                    return executeGenerateContent(context, FALLBACK_SUPPORTED_MODEL);
                } catch (Exception fallbackEx) {
                    log.error("Fallback Gemini call to '{}' also failed: {}", FALLBACK_SUPPORTED_MODEL, fallbackEx.getMessage());
                }
            }

            if (ex.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                throw new GeminiServiceException("Gemini AI rate limit reached. Please retry in a few moments.", ex);
            }
            if (ex.getStatusCode() == HttpStatus.BAD_REQUEST) {
                if (errorDetail.toLowerCase().contains("api key")) {
                    throw new GeminiConfigurationException("Gemini AI API key is invalid: " + errorDetail);
                }
                throw new GeminiServiceException("Gemini AI request rejected: " + errorDetail, ex);
            }
            if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED || ex.getStatusCode() == HttpStatus.FORBIDDEN) {
                throw new GeminiConfigurationException("Gemini AI authorization failed. Please check that GEMINI_API_KEY is valid and has Generative Language API access enabled.");
            }
            if (ex.getStatusCode().is5xxServerError()) {
                throw new GeminiServiceException("Gemini AI service is currently unavailable. Please retry later: " + errorDetail, ex);
            }
            throw new GeminiServiceException("Gemini AI service failed: " + errorDetail, ex);

        } catch (ResourceAccessException ex) {
            log.warn("Gemini AI request timed out or connection failed ({}). Retrying once...", ex.getMessage());
            try {
                Thread.sleep(1500);
                return executeGenerateContent(context, activeModel);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            } catch (Exception retryEx) {
                log.error("Gemini AI retry attempt also failed: {}", retryEx.getMessage());
            }
            throw new GeminiServiceException("Gemini AI service timed out or network connection failed. Please retry later.", ex);

        } catch (Exception ex) {
            if (ex instanceof GeminiConfigurationException || ex instanceof GeminiServiceException) {
                throw ex;
            }
            log.error("Unexpected error during Gemini AI call: {}", ex.getMessage());
            throw new GeminiServiceException("Failed to generate AI report: " + ex.getMessage(), ex);
        }
    }

    private GeminiReportResult executeGenerateContent(GeminiPromptContext context, String targetModel) {
        String prompt = buildClinicalPrompt(context);

        String cleanBaseUrl = baseUrl != null ? baseUrl.trim().replaceAll("/+$", "") : "https://generativelanguage.googleapis.com/v1beta";
        String cleanKey = apiKey.trim();
        String targetUrl = String.format("%s/models/%s:generateContent", cleanBaseUrl, targetModel);

        Map<String, Object> requestBody = new HashMap<>();

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));

        // Add multimodal parts for images or scanned PDFs within size limits
        if (context.getAttachedDocuments() != null) {
            for (ProcessedDocumentContent doc : context.getAttachedDocuments()) {
                if (doc.getRawBytes() != null && doc.getRawBytes().length > 0) {
                    if (doc.getRawBytes().length <= 10 * 1024 * 1024) {
                        String mime = doc.getMimeType();
                        if (mime != null && (mime.startsWith("image/") || "application/pdf".equals(mime))) {
                            String base64 = Base64.getEncoder().encodeToString(doc.getRawBytes());
                            Map<String, Object> inlineData = Map.of(
                                    "mimeType", mime,
                                    "data", base64
                            );
                            parts.add(Map.of("inlineData", inlineData));
                            log.info("Attached multimodal inlineData part for document: {} ({}, {} bytes)",
                                    doc.getFileName(), mime, doc.getRawBytes().length);
                        }
                    } else {
                        log.warn("Document '{}' exceeds 10MB multimodal inline threshold; analyzed via extracted text only.",
                                doc.getFileName());
                    }
                }
            }
        }

        Map<String, Object> content = Map.of("role", "user", "parts", parts);
        requestBody.put("contents", List.of(content));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.1);
        generationConfig.put("responseMimeType", "application/json");
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", cleanKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        log.info("Requesting real Gemini AI clinical summary for case id: {} using model: {} (multimodal parts: {})",
                context.getCaseId(), targetModel, parts.size());

        ResponseEntity<String> response = restTemplate.exchange(targetUrl, HttpMethod.POST, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new GeminiServiceException("Gemini AI returned non-successful status code: " + response.getStatusCode());
        }

        return parseGeminiResponse(response.getBody(), targetModel);
    }

    private GeminiReportResult generateOfflineDemoReport(GeminiPromptContext context) {
        StructuredClinicalSummaryDto summary = new StructuredClinicalSummaryDto();

        List<String> primarySymptoms = context.getPrimarySymptoms() != null ? context.getPrimarySymptoms() : List.of();
        String symptomsList = !primarySymptoms.isEmpty() ? String.join(", ", primarySymptoms) : "Unspecified health discomfort";

        // 1. Chief Complaint
        summary.setChiefComplaint(String.format("Patient reports primary symptoms of %s via guided questionnaire.", symptomsList));

        // 2. History of Present Illness
        StringBuilder hpi = new StringBuilder();
        hpi.append(String.format("Patient (Age: %s, Gender: %s) completed intake consultation in language '%s'. ",
                context.getPatientAge() != null ? context.getPatientAge() : "Not provided",
                context.getPatientGender() != null ? context.getPatientGender() : "Not provided",
                context.getSelectedLanguage() != null ? context.getSelectedLanguage() : "en"));
        hpi.append(String.format("Primary symptoms centered on %s with reported duration of %s. ",
                symptomsList,
                context.getDuration() != null ? context.getDuration() : "recent onset"));
        if (context.getSeverity() != null) {
            hpi.append(String.format("Reported symptom intensity rated at %s. ", context.getSeverity().getDisplayName()));
        }
        if (Boolean.TRUE.equals(context.getIsEmergencyFlagged())) {
            hpi.append("CRITICAL: Patient questionnaire flagged active emergency danger criteria requiring immediate triage. ");
        }
        summary.setHistoryOfPresentIllness(hpi.toString().trim());

        // 3. Symptom Duration and Severity
        summary.setSymptomDurationAndSeverity(String.format("Duration: %s | Severity: %s | Emergency Flag: %s",
                context.getDuration() != null ? context.getDuration() : "Recent",
                context.getSeverity() != null ? context.getSeverity().getDisplayName() : "Moderate",
                Boolean.TRUE.equals(context.getIsEmergencyFlagged()) ? "Active" : "Normal"));

        // 4. Associated Symptoms
        List<String> answersSummary = new ArrayList<>();
        if (context.getSymptomAnswers() != null) {
            for (CaseAnswerDto ans : context.getSymptomAnswers()) {
                answersSummary.add(ans.getQuestionText() + " -> " + ans.getAnswer());
            }
        }
        summary.setAssociatedSymptoms(!answersSummary.isEmpty()
                ? String.join("; ", answersSummary)
                : "No secondary associated symptoms flagged in questionnaire.");

        // 5. Relevant Medical History
        MedicalHistoryDto mh = context.getMedicalHistory();
        if (mh != null && Boolean.TRUE.equals(mh.getProvided())) {
            StringBuilder mhStr = new StringBuilder();
            if (mh.getConditions() != null && !mh.getConditions().isBlank()) mhStr.append("Conditions: ").append(mh.getConditions()).append(". ");
            if (mh.getPastSurgeries() != null && !mh.getPastSurgeries().isBlank()) mhStr.append("Past Surgeries: ").append(mh.getPastSurgeries()).append(". ");
            if (mh.getFamilyHistory() != null && !mh.getFamilyHistory().isBlank()) mhStr.append("Family History: ").append(mh.getFamilyHistory()).append(". ");
            summary.setRelevantMedicalHistory(mhStr.length() > 0 ? mhStr.toString().trim() : "None reported.");
            summary.setCurrentMedicines(mh.getMedications() != null && !mh.getMedications().isBlank() ? mh.getMedications() : "None reported.");
            summary.setKnownAllergies(mh.getAllergies() != null && !mh.getAllergies().isBlank() ? mh.getAllergies() : "No known drug/environmental allergies.");
        } else {
            summary.setRelevantMedicalHistory("Medical history not provided or skipped during intake.");
            summary.setCurrentMedicines("None reported.");
            summary.setKnownAllergies("No known drug or environmental allergies reported.");
        }

        // 6. Previous Medical Reports
        if (context.getAttachedDocuments() != null && !context.getAttachedDocuments().isEmpty()) {
            List<String> docSummaries = new ArrayList<>();
            for (ProcessedDocumentContent doc : context.getAttachedDocuments()) {
                if (doc.isHasTextContent() && doc.getExtractedText() != null) {
                    docSummaries.add(String.format("%s: Extracted text available (%d chars).", doc.getFileName(), doc.getExtractedText().length()));
                } else {
                    docSummaries.add(String.format("%s (%s): %s", doc.getFileName(), doc.getMimeType(), doc.getExtractionNote()));
                }
            }
            summary.setPreviousMedicalReports(String.format("%d attached diagnostic report(s):\n%s",
                    context.getAttachedDocuments().size(), String.join("\n", docSummaries)));
        } else if (context.getUploadedReportNames() != null && !context.getUploadedReportNames().isEmpty()) {
            summary.setPreviousMedicalReports(String.format("%d attached diagnostic report(s): %s",
                    context.getUploadedReportNames().size(), String.join(", ", context.getUploadedReportNames())));
        } else {
            summary.setPreviousMedicalReports("No external diagnostic documents attached to this case.");
        }

        // 7. Patient Reported Information
        summary.setPatientReportedInformation(String.format("Intake recorded via MediConnect. Symptoms: %s; Duration: %s.",
                symptomsList, context.getDuration() != null ? context.getDuration() : "recent"));

        // 8. Missing or Unanswered Information
        List<String> missing = new ArrayList<>();
        if (context.getPatientAge() == null) missing.add("Patient age");
        if (context.getPatientGender() == null) missing.add("Patient gender");
        if (mh == null || !Boolean.TRUE.equals(mh.getProvided())) missing.add("Prior medical history & baseline vitals");
        summary.setMissingOrUnansweredInfo(!missing.isEmpty()
                ? "Pending clinician verification: " + String.join(", ", missing)
                : "Baseline vital parameters (BP, SpO2, Heart Rate, Temperature) required at physical consultation.");

        // 9. Items Requiring Doctor Review
        StringBuilder reviewItems = new StringBuilder();
        reviewItems.append(String.format("1. Perform direct physical examination addressing %s.\n", symptomsList));
        reviewItems.append("2. Comprehensive vital signs assessment.\n");
        if (Boolean.TRUE.equals(context.getIsEmergencyFlagged())) {
            reviewItems.append("3. PRIORITY: Evaluate acute emergency danger signs indicated during patient intake.\n");
        }
        if (context.getUploadedReportNames() != null && !context.getUploadedReportNames().isEmpty()) {
            reviewItems.append(String.format("4. Review attached diagnostic report(s): %s.\n", String.join(", ", context.getUploadedReportNames())));
        }
        reviewItems.append("5. Clinical verification: Confirm findings before prescribing medications or ordering further diagnostics.");
        summary.setItemsRequiringDoctorReview(reviewItems.toString());

        return new GeminiReportResult(
                summary,
                "Offline Demo Synthesizer (College Presentation Mode)",
                0,
                0,
                0,
                true
        );
    }

    private String extractGeminiErrorMessage(HttpStatusCodeException ex) {
        String body = ex.getResponseBodyAsString();
        if (body == null || body.isBlank()) {
            return ex.getStatusCode().toString();
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode errorNode = root.path("error");
            if (errorNode.has("message") && !errorNode.get("message").asText().isBlank()) {
                return errorNode.get("message").asText();
            }
        } catch (Exception ignored) {
            // Non-JSON response fallback
        }
        String clean = body.replaceAll("[\r\n\t]+", " ").trim();
        if (clean.length() > 200) {
            clean = clean.substring(0, 200) + "...";
        }
        return clean.isEmpty() ? ex.getStatusCode().toString() : clean;
    }

    private GeminiReportResult parseGeminiResponse(String responseJson, String targetModel) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);

            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new GeminiServiceException("Gemini AI returned no content candidates.");
            }

            JsonNode firstCandidate = candidates.get(0);
            JsonNode parts = firstCandidate.path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                throw new GeminiServiceException("Gemini AI candidate content is missing parts.");
            }

            String textOutput = parts.get(0).path("text").asText();
            if (textOutput == null || textOutput.trim().isEmpty()) {
                throw new GeminiServiceException("Gemini AI returned empty report text.");
            }

            StructuredClinicalSummaryDto summary = objectMapper.readValue(textOutput, StructuredClinicalSummaryDto.class);

            Integer promptTokens = null;
            Integer completionTokens = null;
            Integer totalTokens = null;

            JsonNode usage = root.path("usageMetadata");
            if (!usage.isMissingNode()) {
                if (usage.has("promptTokenCount")) promptTokens = usage.get("promptTokenCount").asInt();
                if (usage.has("candidatesTokenCount")) completionTokens = usage.get("candidatesTokenCount").asInt();
                if (usage.has("totalTokenCount")) totalTokens = usage.get("totalTokenCount").asInt();
            }

            return new GeminiReportResult(summary, targetModel, promptTokens, completionTokens, totalTokens, false);

        } catch (JsonProcessingException e) {
            log.error("Failed to parse Gemini JSON output: {}", e.getMessage());
            throw new GeminiServiceException("Failed to parse structured clinical report from AI provider.", e);
        }
    }

    private String buildClinicalPrompt(GeminiPromptContext context) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert clinical documentation, prescription-reading, and medical report analysis assistant for triage doctors. ");
        sb.append("Your role is to synthesize the patient's intake information and perform an accurate, structured clinical extraction of all attached prescriptions and medical documents for doctor review.\n\n");

        sb.append("CRITICAL CLINICAL SAFETY RULES:\n");
        sb.append("1. Extract clinical and medication data ONLY from what is visible in the source documents or reported in intake.\n");
        sb.append("2. NEVER invent, assume, or hallucinate missing patient details, medicine names, dosages, durations, diagnoses, or lab values. If information is absent or unreadable, explicitly state that.\n");
        sb.append("3. If handwriting, drug names, or instructions in an uploaded prescription are ambiguous, uncertain, or illegible, explicitly label each as '[UNCERTAIN: ...]' or '[ILLEGIBLE]'.\n");
        sb.append("4. Clearly distinguish extracted text from AI interpretation. Do NOT treat the AI output as a confirmed diagnosis or independently prescribe new medicines.\n");
        sb.append("5. All conclusions are provisional observations for clinician verification and physical examination.\n");
        sb.append("6. Output MUST be valid JSON matching the exact schema below.\n\n");

        sb.append("PATIENT CLINICAL INTAKE DATA:\n");
        sb.append("- Case Reference ID: ").append(context.getCaseId()).append("\n");
        if (context.getPatientAge() != null) sb.append("- Age: ").append(context.getPatientAge()).append("\n");
        if (context.getPatientGender() != null) sb.append("- Gender: ").append(context.getPatientGender()).append("\n");
        if (context.getSelectedLanguage() != null) sb.append("- Language: ").append(context.getSelectedLanguage()).append("\n");
        if (context.getSeverity() != null) sb.append("- Reported Severity: ").append(context.getSeverity().getDisplayName()).append("\n");
        if (context.getDuration() != null) sb.append("- Symptom Duration: ").append(context.getDuration()).append("\n");
        if (context.getIsEmergencyFlagged() != null) sb.append("- Emergency Flag: ").append(context.getIsEmergencyFlagged()).append("\n");

        if (context.getPrimarySymptoms() != null && !context.getPrimarySymptoms().isEmpty()) {
            sb.append("- Primary Symptoms: ").append(String.join(", ", context.getPrimarySymptoms())).append("\n");
        }

        if (context.getSymptomAnswers() != null && !context.getSymptomAnswers().isEmpty()) {
            sb.append("\nPATIENT QUESTIONNAIRE ANSWERS:\n");
            for (CaseAnswerDto a : context.getSymptomAnswers()) {
                sb.append("  * ").append(a.getQuestionText()).append(" -> ").append(a.getAnswer()).append("\n");
            }
        }

        MedicalHistoryDto mh = context.getMedicalHistory();
        if (mh != null && Boolean.TRUE.equals(mh.getProvided())) {
            sb.append("\nPATIENT MEDICAL HISTORY:\n");
            if (mh.getConditions() != null) sb.append("  * Past Conditions: ").append(mh.getConditions()).append("\n");
            if (mh.getMedications() != null) sb.append("  * Current Medications: ").append(mh.getMedications()).append("\n");
            if (mh.getAllergies() != null) sb.append("  * Known Allergies: ").append(mh.getAllergies()).append("\n");
            if (mh.getPastSurgeries() != null) sb.append("  * Past Surgeries: ").append(mh.getPastSurgeries()).append("\n");
            if (mh.getFamilyHistory() != null) sb.append("  * Family History: ").append(mh.getFamilyHistory()).append("\n");
        }

        if (context.getAttachedDocuments() != null && !context.getAttachedDocuments().isEmpty()) {
            sb.append("\nUPLOADED MEDICAL REPORTS & PRESCRIPTIONS:\n");
            sb.append("Thoroughly analyze each attached prescription or diagnostic document (both extracted text and visual image/PDF contents):\n");
            for (ProcessedDocumentContent doc : context.getAttachedDocuments()) {
                sb.append(String.format("\n=== DOCUMENT: %s (MIME: %s) ===\n", doc.getFileName(), doc.getMimeType()));
                if (doc.getExtractionNote() != null) {
                    sb.append("Document Notes: ").append(doc.getExtractionNote()).append("\n");
                }
                if (doc.isHasTextContent() && doc.getExtractedText() != null && !doc.getExtractedText().isBlank()) {
                    sb.append("--- EXTRACTED TEXT FROM REPORT ---\n");
                    sb.append(doc.getExtractedText()).append("\n");
                    sb.append("--- END EXTRACTED TEXT ---\n");
                } else if (doc.isScannedPdf() || doc.isImage()) {
                    sb.append("Visual Document: Raw document/image bytes attached in multimodal payload for optical analysis.\n");
                }
            }
        } else if (context.getUploadedReportNames() != null && !context.getUploadedReportNames().isEmpty()) {
            sb.append("\nATTACHED MEDICAL REPORT REFERENCES:\n");
            for (String reportName : context.getUploadedReportNames()) {
                sb.append("  * ").append(reportName).append("\n");
            }
        }

        sb.append("\nREQUIRED JSON OUTPUT SCHEMA:\n");
        sb.append("{\n");
        sb.append("  \"chiefComplaint\": \"Primary clinical complaint, problem, or indication from patient intake or prescription header\",\n");
        sb.append("  \"historyOfPresentIllness\": \"Concise chronological clinical synthesis for the treating doctor, summarizing document type, clinic/prescribing physician if visible, consultation date, and case progression\",\n");
        sb.append("  \"symptomDurationAndSeverity\": \"Synthesis of symptom duration, intensity, and urgency level (or 'Not documented' if absent)\",\n");
        sb.append("  \"associatedSymptoms\": \"Secondary symptoms or vital signs (BP, pulse, temp, weight) noted in intake or on prescription\",\n");
        sb.append("  \"relevantMedicalHistory\": \"Comprehensive synthesis of pre-existing conditions, past surgeries, or clinical history present in intake or on prescription (do not invent)\",\n");
        sb.append("  \"currentMedicines\": \"Extracted prescription medications: exact medicine names, dosage, form (tab/syrup/cap/inj), frequency (e.g. 1-0-1, OD, BD), and duration exactly as written. If handwriting is ambiguous or uncertain, explicitly tag with [UNCERTAIN: ...]. If none, state 'No medications prescribed'\",\n");
        sb.append("  \"knownAllergies\": \"Documented drug or environmental allergies ONLY if explicitly present in source, otherwise 'None documented'\",\n");
        sb.append("  \"previousMedicalReports\": \"Detailed structured document extraction: (1) Document/Prescription Type, (2) Doctor/Clinic details if visible, (3) Patient details only when visible in source (Name, Age, Gender, Date, Vitals/Weight), (4) Specific clinical notes & diagnostic tests/investigations ordered\",\n");
        sb.append("  \"patientReportedInformation\": \"Direct observations, symptoms, or complaints reported by patient during intake or recorded by prescribing physician\",\n");
        sb.append("  \"missingOrUnansweredInfo\": \"Specific unreadable or ambiguous handwriting, missing dosages/duration, missing vital signs, or clinical information gaps\",\n");
        sb.append("  \"itemsRequiringDoctorReview\": \"Actionable items for reviewing doctor: specific medications/dosages requiring verification, illegible instructions to confirm with patient, and recommended physical examination\"\n");
        sb.append("}\n");

        return sb.toString();
    }
}
