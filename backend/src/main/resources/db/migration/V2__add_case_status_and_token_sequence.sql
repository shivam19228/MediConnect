-- ========================================================
-- MediConnect Database Migration - V2: Case Status & Token Sequences
-- ========================================================

-- 1. Add status column to patient_cases table (default DRAFT)
ALTER TABLE patient_cases
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'DRAFT';

CREATE INDEX idx_cases_status ON patient_cases (status);

-- Update existing cases that already have an intake token to SUBMITTED
UPDATE patient_cases pc
    INNER JOIN intake_tokens it ON pc.id = it.case_id
    SET pc.status = 'SUBMITTED';

-- 2. Create daily_token_sequences table for atomic, concurrent-safe token sequence numbering
CREATE TABLE IF NOT EXISTS daily_token_sequences (
    date_key VARCHAR(8) NOT NULL PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
