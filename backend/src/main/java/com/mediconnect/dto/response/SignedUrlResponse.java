package com.mediconnect.dto.response;

public class SignedUrlResponse {

    private String reportId;
    private String fileName;
    private String contentType;
    private String signedUrl;
    private int expiresInSeconds;

    public SignedUrlResponse() {
    }

    public SignedUrlResponse(String reportId, String fileName, String contentType, String signedUrl, int expiresInSeconds) {
        this.reportId = reportId;
        this.fileName = fileName;
        this.contentType = contentType;
        this.signedUrl = signedUrl;
        this.expiresInSeconds = expiresInSeconds;
    }

    public String getReportId() {
        return reportId;
    }

    public void setReportId(String reportId) {
        this.reportId = reportId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getSignedUrl() {
        return signedUrl;
    }

    public void setSignedUrl(String signedUrl) {
        this.signedUrl = signedUrl;
    }

    public int getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public void setExpiresInSeconds(int expiresInSeconds) {
        this.expiresInSeconds = expiresInSeconds;
    }
}
