package com.mediconnect.storage;

/**
 * Result of a stored document containing safe virtual storage reference, size, and content type.
 */
public class StorageUploadResult {

    private String storageReference;
    private long size;
    private String contentType;

    public StorageUploadResult() {
    }

    public StorageUploadResult(String storageReference, long size, String contentType) {
        this.storageReference = storageReference;
        this.size = size;
        this.contentType = contentType;
    }

    public String getStorageReference() {
        return storageReference;
    }

    public void setStorageReference(String storageReference) {
        this.storageReference = storageReference;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
}
