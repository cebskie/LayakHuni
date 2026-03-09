-- Migration 3: Add OCR result columns to certificate and pbg tables
-- Run: psql -U postgres -d real_estate -f backend/db/migrations/3_ocr_fields.sql

ALTER TABLE certificate
  ADD COLUMN IF NOT EXISTS ocr_raw_text        TEXT,
  ADD COLUMN IF NOT EXISTS ocr_confidence      NUMERIC(4,3),   -- 0.000–1.000
  ADD COLUMN IF NOT EXISTS ocr_status          VARCHAR(10),    -- high/medium/low
  ADD COLUMN IF NOT EXISTS ocr_field_scores    JSONB,          -- per-field scores
  ADD COLUMN IF NOT EXISTS ocr_processed_at    TIMESTAMP;

ALTER TABLE pbg
  ADD COLUMN IF NOT EXISTS ocr_raw_text        TEXT,
  ADD COLUMN IF NOT EXISTS ocr_confidence      NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS ocr_status          VARCHAR(10),
  ADD COLUMN IF NOT EXISTS ocr_field_scores    JSONB,
  ADD COLUMN IF NOT EXISTS ocr_processed_at    TIMESTAMP;

-- Cross-validation results stored per property
CREATE TABLE IF NOT EXISTS ocr_cross_validation (
  cv_id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prop_id                     UUID NOT NULL REFERENCES property(prop_id) ON DELETE CASCADE,
  owner_name_similarity       NUMERIC(4,3),
  address_cert_pbg_similarity NUMERIC(4,3),
  address_photo_similarity    NUMERIC(4,3),
  issues                      JSONB,           -- array of issue strings
  cert_confidence_adjusted    NUMERIC(4,3),
  pbg_confidence_adjusted     NUMERIC(4,3),
  cert_status_adjusted        VARCHAR(10),
  pbg_status_adjusted         VARCHAR(10),
  validated_at                TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocr_cv_prop ON ocr_cross_validation(prop_id);
