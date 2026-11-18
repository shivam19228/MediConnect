-- ========================================================
-- MediConnect Database Foundation - Initial Schema (V1)
-- Database: mediconnect_db (MySQL 8 / InnoDB / utf8mb4)
-- ========================================================

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed core application roles
INSERT INTO roles (id, name, description, created_at) VALUES
(1, 'PATIENT', 'Patient role for guided case-taking and personal case tracking', CURRENT_TIMESTAMP(6)),
(2, 'DOCTOR', 'Doctor role for reviewing incoming cases, clinical notes, and recommendations', CURRENT_TIMESTAMP(6)),
(3, 'ADMIN', 'Administrative user role with overall system oversight', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    avatar_url VARCHAR(500) NULL,
    specialty VARCHAR(100) NULL,
    role_id BIGINT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_role_id ON users (role_id);

-- 3. Patient Profiles Table
CREATE TABLE IF NOT EXISTS patient_profiles (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    age INT NULL,
    gender VARCHAR(20) NULL,
    date_of_birth DATE NULL,
    blood_group VARCHAR(10) NULL,
    address VARCHAR(500) NULL,
    emergency_contact_name VARCHAR(100) NULL,
    emergency_contact_phone VARCHAR(30) NULL,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'hi',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_patient_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Patient Cases Table
CREATE TABLE IF NOT EXISTS patient_cases (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_user_id VARCHAR(64) NULL,
    patient_name VARCHAR(100) NOT NULL,
    patient_age INT NULL,
    patient_gender VARCHAR(20) NULL,
    patient_phone VARCHAR(30) NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'hi',
    severity VARCHAR(20) NOT NULL DEFAULT 'MODERATE',
    duration VARCHAR(100) NULL,
    is_emergency_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_cases_patient_user FOREIGN KEY (patient_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cases_patient_user_id ON patient_cases (patient_user_id);
CREATE INDEX idx_cases_created_at ON patient_cases (created_at);
CREATE INDEX idx_cases_emergency ON patient_cases (is_emergency_flagged);

-- 5. Case Primary Symptoms Table (Element Collection)
CREATE TABLE IF NOT EXISTS case_primary_symptoms (
    case_id VARCHAR(64) NOT NULL,
    symptom VARCHAR(100) NOT NULL,
    CONSTRAINT fk_case_symptoms_case FOREIGN KEY (case_id) REFERENCES patient_cases (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_case_symptoms_case_id ON case_primary_symptoms (case_id);

-- 6. Case Questionnaire Answers Table
CREATE TABLE IF NOT EXISTS case_answers (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    question_text VARCHAR(500) NULL,
    answer TEXT NOT NULL,
    audio_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_case_answers_case FOREIGN KEY (case_id) REFERENCES patient_cases (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_case_answers_case_id ON case_answers (case_id);
CREATE INDEX idx_case_answers_question_id ON case_answers (question_id);

-- 7. Intake Tokens Table
CREATE TABLE IF NOT EXISTS intake_tokens (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    token_number VARCHAR(50) NOT NULL UNIQUE,
    case_id VARCHAR(64) NOT NULL UNIQUE,
    submitted_at DATETIME(6) NOT NULL,
    day_of_week VARCHAR(20) NULL,
    formatted_date VARCHAR(50) NULL,
    formatted_time VARCHAR(20) NULL,
    status VARCHAR(100) NOT NULL DEFAULT 'Submitted — Awaiting Doctor Review',
    uploaded_report_count INT NOT NULL DEFAULT 0,
    department VARCHAR(100) NULL DEFAULT 'General Medicine & Triage',
    locale VARCHAR(20) NULL DEFAULT 'hi-IN',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_intake_tokens_case FOREIGN KEY (case_id) REFERENCES patient_cases (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tokens_token_number ON intake_tokens (token_number);

-- 8. Medical History Table
CREATE TABLE IF NOT EXISTS medical_histories (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL UNIQUE,
    conditions TEXT NULL,
    medications TEXT NULL,
    allergies TEXT NULL,
    past_surgeries TEXT NULL,
    family_history TEXT NULL,
    provided BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_medical_histories_case FOREIGN KEY (case_id) REFERENCES patient_cases (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Medical Reports Metadata Table (metadata and storage reference, not raw file bytes)
CREATE TABLE IF NOT EXISTS medical_reports (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    storage_reference VARCHAR(500) NULL,
    preview_url VARCHAR(1000) NULL,
    upload_date VARCHAR(30) NULL,
    is_image BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_medical_reports_case FOREIGN KEY (case_id) REFERENCES patient_cases (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_medical_reports_case_id ON medical_reports (case_id);

-- 10. AI Generated Case Reports Table
CREATE TABLE IF NOT EXISTS generated_case_reports (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL UNIQUE,
    selected_language VARCHAR(100) NULL,
    chief_complaint TEXT NULL,
    history_of_present_illness TEXT NULL,
    symptom_duration_and_severity TEXT NULL,
    associated_symptoms TEXT NULL,
    relevant_medical_history TEXT NULL,
    current_medicines TEXT NULL,
    known_allergies TEXT NULL,
    previous_medical_reports TEXT NULL,
    patient_reported_information TEXT NULL,
    missing_or_unanswered_info TEXT NULL,
    items_requiring_doctor_review TEXT NULL,
    is_demo_generated BOOLEAN NOT NULL DEFAULT TRUE,
    generated_at DATETIME(6) NOT NULL,
    model_name VARCHAR(100) NULL,
    prompt_tokens INT NULL,
    completion_tokens INT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_gen_case_reports_case FOREIGN KEY (case_id) REFERENCES patient_cases (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Doctor Reviews Table
CREATE TABLE IF NOT EXISTS doctor_reviews (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW',
    doctor_notes TEXT NULL,
    follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
    clinical_recommendations TEXT NULL,
    doctor_user_id VARCHAR(64) NULL,
    reviewed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_doctor_reviews_case FOREIGN KEY (case_id) REFERENCES patient_cases (id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_reviews_doctor FOREIGN KEY (doctor_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_doctor_reviews_status ON doctor_reviews (status);
CREATE INDEX idx_doctor_reviews_doctor_user_id ON doctor_reviews (doctor_user_id);
