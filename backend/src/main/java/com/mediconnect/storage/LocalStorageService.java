package com.mediconnect.storage;

/**
 * Service interface for secure local document storage.
 * Stores files outside the web root, prevents path traversal, and returns safe virtual references.
 */
public interface LocalStorageService {

    /**
     * Stores file content at the specified relative storage path.
     *
     * @param relativePath relative safe virtual path, e.g. cases/{caseId}/{uuid}_{filename}
     * @param content file bytes
     * @param contentType MIME type of the file
     * @return metadata result including storage reference and size
     */
    StorageUploadResult storeFile(String relativePath, byte[] content, String contentType);

    /**
     * Loads raw file bytes from local storage.
     *
     * @param relativePath relative safe virtual path
     * @return byte content of the stored file
     */
    byte[] loadFile(String relativePath);

    /**
     * Deletes a stored file if it exists.
     *
     * @param relativePath relative safe virtual path
     */
    void deleteFile(String relativePath);

    /**
     * Checks if a file exists at the given relative storage path.
     *
     * @param relativePath relative safe virtual path
     * @return true if the file exists and is a regular file
     */
    boolean fileExists(String relativePath);
}
