package com.mediconnect.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "daily_token_sequences")
public class DailyTokenSequence {

    @Id
    @Column(name = "date_key", length = 8, nullable = false)
    private String dateKey;

    @Column(name = "last_seq", nullable = false)
    private Integer lastSeq = 0;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public DailyTokenSequence() {
    }

    public DailyTokenSequence(String dateKey, Integer lastSeq) {
        this.dateKey = dateKey;
        this.lastSeq = lastSeq;
    }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public String getDateKey() {
        return dateKey;
    }

    public void setDateKey(String dateKey) {
        this.dateKey = dateKey;
    }

    public Integer getLastSeq() {
        return lastSeq;
    }

    public void setLastSeq(Integer lastSeq) {
        this.lastSeq = lastSeq;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
