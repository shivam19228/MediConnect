package com.mediconnect.storage;

import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.exception.StorageException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalStorageServiceImplTest {

    @TempDir
    Path tempStorageDir;

    private LocalStorageServiceImpl storageService;

    @BeforeEach
    void setUp() {
        storageService = new LocalStorageServiceImpl(tempStorageDir.toString());
        storageService.init();
    }

    @Test
    @DisplayName("Should successfully store and load file with identical content")
    void testStoreAndLoadFile_Success() {
        String relativePath = "cases/case-123/uuid-abc_test.pdf";
        byte[] content = "Hello Medical Connect Local Storage".getBytes(StandardCharsets.UTF_8);
        String contentType = "application/pdf";

        StorageUploadResult result = storageService.storeFile(relativePath, content, contentType);

        assertThat(result).isNotNull();
        assertThat(result.getStorageReference()).isEqualTo("cases/case-123/uuid-abc_test.pdf");
        assertThat(result.getSize()).isEqualTo(content.length);
        assertThat(result.getContentType()).isEqualTo(contentType);

        assertThat(storageService.fileExists(relativePath)).isTrue();

        byte[] loaded = storageService.loadFile(relativePath);
        assertThat(loaded).isEqualTo(content);
    }

    @Test
    @DisplayName("Should reject storing empty content")
    void testStoreEmptyContent_ThrowsStorageException() {
        assertThatThrownBy(() -> storageService.storeFile("cases/case-1/test.pdf", new byte[0], "application/pdf"))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("Cannot store empty file content");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when loading non-existent file")
    void testLoadNonExistentFile_ThrowsResourceNotFoundException() {
        assertThatThrownBy(() -> storageService.loadFile("cases/case-nonexistent/report.pdf"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Document not found in storage");
    }

    @Test
    @DisplayName("Should successfully delete stored file")
    void testDeleteFile_Success() {
        String relativePath = "cases/case-del/to_delete.png";
        byte[] content = new byte[]{0x12, 0x34};

        storageService.storeFile(relativePath, content, "image/png");
        assertThat(storageService.fileExists(relativePath)).isTrue();

        storageService.deleteFile(relativePath);
        assertThat(storageService.fileExists(relativePath)).isFalse();
    }

    @Test
    @DisplayName("Should prevent path traversal with relative parent segments (../)")
    void testPathTraversal_DotDot_Rejected() {
        assertThatThrownBy(() -> storageService.storeFile("../escape.txt", "data".getBytes(StandardCharsets.UTF_8), "text/plain"))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("Path traversal detected");

        assertThatThrownBy(() -> storageService.loadFile("cases/../../windows/system32/cmd.exe"))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("Path traversal detected");
    }

    @Test
    @DisplayName("Should prevent path traversal with Windows backslashes")
    void testPathTraversal_Backslashes_Rejected() {
        assertThatThrownBy(() -> storageService.loadFile("..\\..\\secret.key"))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("Path traversal detected");
    }

    @Test
    @DisplayName("Should reject blank or null storage paths")
    void testEmptyPath_Rejected() {
        assertThatThrownBy(() -> storageService.storeFile("   ", "data".getBytes(StandardCharsets.UTF_8), "text/plain"))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("Storage path cannot be empty");

        assertThatThrownBy(() -> storageService.loadFile(null))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("Storage path cannot be empty");
    }
}
