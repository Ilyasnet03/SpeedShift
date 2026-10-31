ALTER TABLE users
    ADD COLUMN password_reset_code VARCHAR(100),
    ADD COLUMN password_reset_expires_at TIMESTAMP,
    ADD COLUMN password_reset_sent_at TIMESTAMP,
    ADD COLUMN password_reset_attempts INTEGER NOT NULL DEFAULT 0;
