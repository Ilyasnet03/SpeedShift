ALTER TABLE listings ADD COLUMN expires_at TIMESTAMP;
ALTER TABLE listings ADD COLUMN expiry_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN show_phone BOOLEAN NOT NULL DEFAULT TRUE;
UPDATE listings SET expires_at = CURRENT_TIMESTAMP + INTERVAL '30' DAY;

CREATE TABLE seller_reviews (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_seller_reviews UNIQUE (seller_id, reviewer_id)
);
CREATE INDEX idx_seller_reviews_seller ON seller_reviews (seller_id);

CREATE TABLE listing_reports (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(40) NOT NULL,
    details VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    CONSTRAINT uq_listing_reports UNIQUE (listing_id, reporter_id)
);
CREATE INDEX idx_listing_reports_status ON listing_reports (status);

CREATE TABLE listing_events (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_listing_events_listing ON listing_events (listing_id, event_type);
CREATE INDEX idx_listing_events_created ON listing_events (created_at);

CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_conversations UNIQUE (listing_id, buyer_id)
);
CREATE INDEX idx_conversations_buyer ON conversations (buyer_id);
CREATE INDEX idx_conversations_seller ON conversations (seller_id);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, id);

CREATE TABLE admin_audit_log (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT,
    admin_email VARCHAR(255),
    action VARCHAR(60) NOT NULL,
    target_type VARCHAR(30),
    target_id BIGINT,
    details VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_admin_audit_created ON admin_audit_log (created_at DESC);
