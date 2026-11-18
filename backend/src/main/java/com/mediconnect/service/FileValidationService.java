package com.mediconnect.service;

import com.mediconnect.exception.InvalidFileException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Service for strict validation of uploaded patient medical documents.
 * Enforces file size limits, extension whitelisting, MIME type checks,
 * file signature (magic bytes) verification, and safe storage key generation.
 */
@Service
public class FileValidationService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    // Magic byte signatures
    private static final byte[] PDF_SIGNATURE = new byte[]{0x25, 0x50, 0x44, 0x46}; // %PDF
    private static final byte[] JPEG_SIGNATURE = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_SIGNATURE = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    @Value("${mediconnect.storage.max-file-size-bytes:15728640}") // 15 MB default
    private long maxFileSizeBytes;

    /**
     * Performs end-to-end file validation.
     */
    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() == 0) {
            throw new InvalidFileException("Uploaded file is empty.");
        }

        if (file.getSize() > maxFileSizeBytes) {
            throw new InvalidFileException("File size exceeds maximum permitted limit of 15 MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new InvalidFileException("Uploaded file must have a valid filename.");
        }

        String extension = extractExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new InvalidFileException("Unsupported file extension: ." + extension + ". Only PDF, JPG, and PNG documents are permitted.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new InvalidFileException("Unsupported MIME type: " + contentType + ". Only PDF, JPG, and PNG documents are permitted.");
        }

        validateMagicBytes(file, extension);
    }

    /**
     * Checks initial magic bytes against declared file format to prevent file spoofing.
     */
    private void validateMagicBytes(MultipartFile file, String extension) {
        byte[] header = new byte[8];
        int bytesRead;

        try (InputStream is = file.getInputStream()) {
            bytesRead = is.read(header);
        } catch (IOException e) {
            throw new InvalidFileException("Failed to inspect file stream: " + e.getMessage());
        }

        if (bytesRead < 4) {
            throw new InvalidFileException("File is too small to be a valid document.");
        }

        boolean matches = switch (extension) {
            case "pdf" -> matchesSignature(header, PDF_SIGNATURE);
            case "jpg", "jpeg" -> matchesSignature(header, JPEG_SIGNATURE);
            case "png" -> matchesSignature(header, PNG_SIGNATURE);
            default -> false;
        };

        if (!matches) {
            throw new InvalidFileException("File content signature does not match declared format (." + extension + ").");
        }
    }

    private boolean matchesSignature(byte[] header, byte[] signature) {
        if (header.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if (header[i] != signature[i]) {
                return false;
            }
        }
        return true;
    }

    public String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex == -1 || dotIndex == filename.length() - 1) {
            throw new InvalidFileException("File has no valid extension.");
        }
        return filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT).trim();
    }

    public boolean isImage(String contentType, String extension) {
        return "png".equalsIgnoreCase(extension) ||
                "jpg".equalsIgnoreCase(extension) ||
                "jpeg".equalsIgnoreCase(extension) ||
                (contentType != null && contentType.toLowerCase(Locale.ROOT).startsWith("image/"));
    }

    /**
     * Generates an unpredictable, sanitized object storage path to prevent path traversal and collisions.
     * Format: cases/{caseId}/{uuid}_{sanitizedName}
     */
    public String generateStoragePath(String caseId, String originalFilename) {
        String cleanCaseId = caseId.replaceAll("[^a-zA-Z0-9-]", "");
        int lastSlash = Math.max(originalFilename.lastIndexOf('/'), originalFilename.lastIndexOf('\\'));
        String baseName = lastSlash >= 0 ? originalFilename.substring(lastSlash + 1) : originalFilename;
        String ext = extractExtension(baseName);
        String nameWithoutExt = baseName.lastIndexOf('.') >= 0 ? baseName.substring(0, baseName.lastIndexOf('.')) : baseName;
        String cleanBaseName = nameWithoutExt.replaceAll("[^a-zA-Z0-9_-]", "_");
        if (cleanBaseName.length() > 50) {
            cleanBaseName = cleanBaseName.substring(0, 50);
        }

        return String.format("cases/%s/%s_%s.%s", cleanCaseId, UUID.randomUUID(), cleanBaseName, ext);
    }

    /**
     * Normalizes the MIME type for document storage compatibility.
     * Enforces standard IANA MIME types and converts non-standard types such as image/jpg to image/jpeg.
     */
    public String normalizeContentType(String contentType, String extension) {
        String ext = extension != null ? extension.toLowerCase(Locale.ROOT).trim() : "";
        if ("pdf".equals(ext)) {
            return "application/pdf";
        }
        if ("jpg".equals(ext) || "jpeg".equals(ext)) {
            return "image/jpeg";
        }
        if ("png".equals(ext)) {
            return "image/png";
        }
        if (contentType != null && !contentType.isBlank()) {
            String ct = contentType.toLowerCase(Locale.ROOT).trim();
            if ("image/jpg".equals(ct)) {
                return "image/jpeg";
            }
            int semi = ct.indexOf(';');
            return semi != -1 ? ct.substring(0, semi).trim() : ct;
        }
        return "application/octet-stream";
    }
}
