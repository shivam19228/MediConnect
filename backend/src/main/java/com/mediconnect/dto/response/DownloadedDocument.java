package com.mediconnect.dto.response;

public record DownloadedDocument(String filename, String contentType, byte[] data) {
}
