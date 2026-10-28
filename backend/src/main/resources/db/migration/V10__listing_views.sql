CREATE TABLE listing_views (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listing_views_viewed_at ON listing_views (viewed_at DESC);
CREATE INDEX idx_listing_views_listing ON listing_views (listing_id);
