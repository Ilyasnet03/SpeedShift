ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN verification_code VARCHAR(100),
    ADD COLUMN verification_expires_at TIMESTAMP,
    ADD COLUMN verification_sent_at TIMESTAMP,
    ADD COLUMN verification_attempts INTEGER NOT NULL DEFAULT 0;
