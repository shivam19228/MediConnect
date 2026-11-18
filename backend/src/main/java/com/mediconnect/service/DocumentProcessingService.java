package com.mediconnect.service;

import com.mediconnect.dto.ai.ProcessedDocumentContent;
import com.mediconnect.entity.MedicalReport;
import com.mediconnect.storage.LocalStorageService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class DocumentProcessingService {

    private static final Logger log = LoggerFactory.getLogger(DocumentProcessingService.class);

    private final LocalStorageService localStorageService;

    public DocumentProcessingService(LocalStorageService localStorageService) {
        this.localStorageService = localStorageService;
    }

    /**
     * Processes an uploaded medical report: loads bytes from private local storage,
     * extracts readable text if PDF, detects scanned documents, and packages
     * content
     * for multimodal Gemini analysis.
     */
    public ProcessedDocumentContent processDocument(MedicalReport report) {
        if (report == null || report.getStorageReference() == null) {
            ProcessedDocumentContent empty = new ProcessedDocumentContent();
            empty.setFileName(report != null ? report.getName() : "Unknown");
            empty.setExtractionNote("Document reference missing or not stored.");
            return empty;
        }

        String storageRef = report.getStorageReference();
        byte[] fileBytes;
        try {
            fileBytes = localStorageService.loadFile(storageRef);
        } catch (Exception ex) {
            log.error("Failed to load document bytes from local storage for report id {}: {}", report.getId(),
                    ex.getMessage());
            ProcessedDocumentContent failed = new ProcessedDocumentContent();
            failed.setFileName(report.getName());
            failed.setExtractionNote("Failed to read document from storage: " + ex.getMessage());
            return failed;
        }

        if (fileBytes == null || fileBytes.length == 0) {
            ProcessedDocumentContent empty = new ProcessedDocumentContent();
            empty.setFileName(report.getName());
            empty.setExtractionNote("Document file is empty (0 bytes).");
            return empty;
        }

        String fileName = report.getName();
        String contentType = report.getType() != null ? report.getType().toLowerCase() : "";
        String ext = "";
        int dotIdx = fileName.lastIndexOf('.');
        if (dotIdx >= 0) {
            ext = fileName.substring(dotIdx + 1).toLowerCase();
        }

        boolean isPdf = "application/pdf".equals(contentType) || "pdf".equals(ext);
        boolean isImage = report.getIsImage() || contentType.startsWith("image/") || "jpg".equals(ext)
                || "jpeg".equals(ext) || "png".equals(ext);

        ProcessedDocumentContent result = new ProcessedDocumentContent();
        result.setFileName(fileName);
        result.setRawBytes(fileBytes);

        if (isPdf) {
            result.setMimeType("application/pdf");
            result.setImage(false);

            try (PDDocument document = Loader.loadPDF(fileBytes)) {
                int pageCount = document.getNumberOfPages();
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                String extractedText = stripper.getText(document);

                if (extractedText != null && extractedText.trim().length() > 30) {
                    result.setExtractedText(extractedText.trim());
                    result.setHasTextContent(true);
                    result.setScannedPdf(false);
                    result.setExtractionNote(
                            String.format("Successfully extracted text from %d page(s) of PDF.", pageCount));
                    log.info("Extracted {} characters of text from PDF report '{}' for analysis",
                            extractedText.length(), fileName);
                } else {
                    result.setHasTextContent(false);
                    result.setScannedPdf(true);
                    result.setExtractionNote(String.format(
                            "PDF contains %d page(s) with minimal or scanned text. Provided as document bytes for visual analysis.",
                            pageCount));
                    log.info(
                            "PDF report '{}' appears to be scanned or image-based. Attaching document bytes for multimodal input.",
                            fileName);
                }
            } catch (Exception ex) {
                log.warn("PDFBox text extraction failed for '{}': {}. Treating as binary document.", fileName,
                        ex.getMessage());
                result.setHasTextContent(false);
                result.setScannedPdf(true);
                result.setExtractionNote("PDF text stream could not be parsed: " + ex.getMessage()
                        + ". Provided as binary document bytes.");
            }

            return result;
        }

        if (isImage) {
            String imageMimeType = "image/png".equals(contentType) || "png".equals(ext) ? "image/png" : "image/jpeg";
            result.setMimeType(imageMimeType);
            result.setImage(true);
            result.setHasTextContent(false);
            result.setScannedPdf(false);
            result.setExtractionNote(String.format("Medical image file (%s, %d KB). Attached for visual analysis.",
                    imageMimeType, fileBytes.length / 1024));
            log.info("Packaged image report '{}' ({}) for Gemini multimodal analysis", fileName, imageMimeType);
            return result;
        }

        // Other supported file types
        result.setMimeType(contentType.isBlank() ? "application/octet-stream" : contentType);
        result.setExtractionNote("Document type: " + result.getMimeType());
        return result;
    }
}
