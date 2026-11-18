package com.mediconnect.storage;

import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.exception.StorageException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

/**
 * Production implementation of LocalStorageService.
 * Securely stores medical documents in a configurable directory on the local filesystem.
 * Enforces strict path traversal prevention, directory segregation, and safe virtual references.
 */
@Service
public class LocalStorageServiceImpl implements LocalStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageServiceImpl.class);

    private final Path rootLocation;

    public LocalStorageServiceImpl(@Value("${mediconnect.storage.local-dir:uploads/medical-reports}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.rootLocation);
            log.info("Initialized secure local medical document storage at: {}", this.rootLocation);
        } catch (IOException e) {
            log.error("Failed to initialize storage root directory: {}", e.getMessage());
            throw new StorageException("Could not initialize local document storage directory", e);
        }
    }

    @Override
    public StorageUploadResult storeFile(String relativePath, byte[] content, String contentType) {
        if (content == null || content.length == 0) {
            throw new StorageException("Cannot store empty file content.");
        }

        Path destinationPath = resolveAndVerify(relativePath);

        try {
            Path parent = destinationPath.getParent();
            if (parent != null && !Files.exists(parent)) {
                Files.createDirectories(parent);
            }

            Files.write(destinationPath, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
            log.info("Successfully stored document at relative path: [{}], size: {} bytes", relativePath, content.length);

            // Normalized virtual storage reference (use forward slashes for cross-platform consistency)
            String safeStorageRef = relativePath.replace('\\', '/').replaceAll("^/+", "");
            return new StorageUploadResult(safeStorageRef, content.length, contentType);

        } catch (IOException e) {
            log.error("Failed to write document content to file system: {}", e.getMessage());
            throw new StorageException("Failed to store document locally: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] loadFile(String relativePath) {
        Path filePath = resolveAndVerify(relativePath);

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            log.warn("Requested document does not exist at relative path: [{}]", relativePath);
            throw new ResourceNotFoundException("Document not found in storage: " + relativePath);
        }

        try {
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Failed to read document from disk: {}", e.getMessage());
            throw new StorageException("Failed to read document: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) {
            return;
        }

        try {
            Path filePath = resolveAndVerify(relativePath);
            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) {
                log.info("Deleted document from local storage: [{}]", relativePath);
            }
        } catch (Exception e) {
            log.warn("Failed or ignored error while deleting document [{}]: {}", relativePath, e.getMessage());
        }
    }

    @Override
    public boolean fileExists(String relativePath) {
        try {
            Path filePath = resolveAndVerify(relativePath);
            return Files.exists(filePath) && Files.isRegularFile(filePath);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Resolves a relative storage path against rootLocation and verifies that it does not escape the root.
     * Prevents path traversal vulnerabilities (e.g. "../", absolute drive letters, UNC paths).
     */
    private Path resolveAndVerify(String relativePath) {
        if (relativePath == null || relativePath.trim().isEmpty()) {
            throw new StorageException("Storage path cannot be empty.");
        }

        // Clean any leading slashes or Windows backslashes
        String sanitized = relativePath.trim().replace('\\', '/').replaceAll("^/+", "");

        // Path traversal sanity check
        if (sanitized.contains("../") || sanitized.contains("/..") || sanitized.equals("..")) {
            throw new StorageException("Security violation: Path traversal detected in storage path: " + relativePath);
        }

        Path resolved = rootLocation.resolve(sanitized).normalize();

        if (!resolved.startsWith(rootLocation)) {
            throw new StorageException("Security violation: Path traversal outside storage root: " + relativePath);
        }

        return resolved;
    }

    /**
     * Visible for testing to verify root directory resolution.
     */
    public Path getRootLocation() {
        return rootLocation;
    }
}
