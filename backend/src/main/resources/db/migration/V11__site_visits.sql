CREATE TABLE site_visits (
    id BIGSERIAL PRIMARY KEY,
    visitor_id VARCHAR(64) NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    path VARCHAR(255) NOT NULL,
    user_agent VARCHAR(255),
    visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_site_visits_visited_at ON site_visits (visited_at DESC);
