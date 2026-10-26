CREATE TABLE uploaded_images (
    name       VARCHAR(80) PRIMARY KEY,
    data       BYTEA NOT NULL,
    thumbnail  BYTEA NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
