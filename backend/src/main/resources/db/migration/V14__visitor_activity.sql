CREATE TABLE visitor_activity (
    id BIGSERIAL PRIMARY KEY,
    visitor_id VARCHAR(64) NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    day DATE NOT NULL,
    seconds BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_visitor_activity UNIQUE (visitor_id, day)
);

CREATE INDEX idx_visitor_activity_day ON visitor_activity (day);
