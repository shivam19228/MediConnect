package com.mediconnect.dto.ai;

public class ProcessedDocumentContent {

    private String fileName;
    private String mimeType;
    private String extractedText;
    private byte[] rawBytes;
    private boolean isImage;
    private boolean isScannedPdf;
    private boolean hasTextContent;
    private String extractionNote;

    public ProcessedDocumentContent() {
    }

    public ProcessedDocumentContent(
            String fileName,
            String mimeType,
            String extractedText,
            byte[] rawBytes,
            boolean isImage,
            boolean isScannedPdf,
            boolean hasTextContent,
            String extractionNote) {
        this.fileName = fileName;
        this.mimeType = mimeType;
        this.extractedText = extractedText;
        this.rawBytes = rawBytes;
        this.isImage = isImage;
        this.isScannedPdf = isScannedPdf;
        this.hasTextContent = hasTextContent;
        this.extractionNote = extractionNote;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public byte[] getRawBytes() {
        return rawBytes;
    }

    public void setRawBytes(byte[] rawBytes) {
        this.rawBytes = rawBytes;
    }

    public boolean isImage() {
        return isImage;
    }

    public void setImage(boolean image) {
        isImage = image;
    }

    public boolean isScannedPdf() {
        return isScannedPdf;
    }

    public void setScannedPdf(boolean scannedPdf) {
        isScannedPdf = scannedPdf;
    }

    public boolean isHasTextContent() {
        return hasTextContent;
    }

    public void setHasTextContent(boolean hasTextContent) {
        this.hasTextContent = hasTextContent;
    }

    public String getExtractionNote() {
        return extractionNote;
    }

    public void setExtractionNote(String extractionNote) {
        this.extractionNote = extractionNote;
    }
}

