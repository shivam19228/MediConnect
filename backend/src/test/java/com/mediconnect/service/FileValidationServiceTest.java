package com.mediconnect.service;

import com.mediconnect.exception.InvalidFileException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileValidationServiceTest {

    private FileValidationService fileValidationService;

    @BeforeEach
    void setUp() {
        fileValidationService = new FileValidationService();
        ReflectionTestUtils.setField(fileValidationService, "maxFileSizeBytes", 15728640L); // 15 MB
    }

    @Test
    @DisplayName("Valid PDF document passes all validation checks")
    void testValidatePdf_Success() {
        byte[] pdfBytes = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34}; // %PDF-1.4
        MockMultipartFile file = new MockMultipartFile(
                "file", "blood_report.pdf", "application/pdf", pdfBytes);

        fileValidationService.validateFile(file);
    }

    @Test
    @DisplayName("Valid JPEG image passes all validation checks")
    void testValidateJpeg_Success() {
        byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
        MockMultipartFile file = new MockMultipartFile(
                "file", "scan.jpg", "image/jpeg", jpegBytes);

        fileValidationService.validateFile(file);
    }

    @Test
    @DisplayName("Valid PNG image passes all validation checks")
    void testValidatePng_Success() {
        byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00};
        MockMultipartFile file = new MockMultipartFile(
                "file", "xray.png", "image/png", pngBytes);

        fileValidationService.validateFile(file);
    }

    @Test
    @DisplayName("Unsupported file extension throws InvalidFileException")
    void testUnsupportedExtension_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "document.exe", "application/octet-stream", new byte[]{0x4D, 0x5A, 0x00, 0x00});

        assertThatThrownBy(() -> fileValidationService.validateFile(file))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("Unsupported file extension");
    }

    @Test
    @DisplayName("Unsupported MIME type throws InvalidFileException")
    void testUnsupportedMimeType_ThrowsException() {
        byte[] pdfBytes = new byte[]{0x25, 0x50, 0x44, 0x46};
        MockMultipartFile file = new MockMultipartFile(
                "file", "report.pdf", "text/plain", pdfBytes);

        assertThatThrownBy(() -> fileValidationService.validateFile(file))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("Unsupported MIME type");
    }

    @Test
    @DisplayName("File with spoofed extension and invalid magic bytes throws InvalidFileException")
    void testSpoofedMagicBytes_ThrowsException() {
        byte[] fakePdfBytes = "This is just plain text, not a valid PDF".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "fake.pdf", "application/pdf", fakePdfBytes);

        assertThatThrownBy(() -> fileValidationService.validateFile(file))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("File content signature does not match declared format");
    }

    @Test
    @DisplayName("Oversized file exceeding 15 MB throws InvalidFileException")
    void testOversizedFile_ThrowsException() {
        ReflectionTestUtils.setField(fileValidationService, "maxFileSizeBytes", 100L); // set limit to 100 bytes for test
        byte[] largeBytes = new byte[200];
        largeBytes[0] = 0x25; largeBytes[1] = 0x50; largeBytes[2] = 0x44; largeBytes[3] = 0x46;

        MockMultipartFile file = new MockMultipartFile(
                "file", "large.pdf", "application/pdf", largeBytes);

        assertThatThrownBy(() -> fileValidationService.validateFile(file))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("File size exceeds maximum permitted limit");
    }

    @Test
    @DisplayName("Empty file throws InvalidFileException")
    void testEmptyFile_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> fileValidationService.validateFile(file))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("Uploaded file is empty");
    }

    @Test
    @DisplayName("Storage path generation prevents path traversal and generates unpredictable names")
    void testGenerateStoragePath_SafeAndUnpredictable() {
        String path = fileValidationService.generateStoragePath("case-uuid-123", "../../malicious/file..name.pdf");

        assertThat(path).startsWith("cases/case-uuid-123/");
        assertThat(path).doesNotContain("..");
        assertThat(path).endsWith(".pdf");
    }

    @Test
    @DisplayName("Normalizes MIME types ensuring standard IANA types for document storage")
    void testNormalizeContentType() {
        assertThat(fileValidationService.normalizeContentType("image/jpg", "jpg"))
                .isEqualTo("image/jpeg");
        assertThat(fileValidationService.normalizeContentType("image/jpeg", "jpeg"))
                .isEqualTo("image/jpeg");
        assertThat(fileValidationService.normalizeContentType("image/png", "png"))
                .isEqualTo("image/png");
        assertThat(fileValidationService.normalizeContentType("application/pdf", "pdf"))
                .isEqualTo("application/pdf");
        assertThat(fileValidationService.normalizeContentType("image/jpeg; charset=UTF-8", "jpg"))
                .isEqualTo("image/jpeg");
    }
}
