ALTER TABLE listings
    ADD COLUMN seller_id BIGINT;

ALTER TABLE listings
    ADD CONSTRAINT fk_listings_seller
    FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_listings_seller_id ON listings (seller_id);

UPDATE listings listing
SET seller_id = (
    SELECT MIN(account.id)
    FROM users account
    WHERE regexp_replace(account.phone, '[^0-9]', '', 'g')
        = regexp_replace(listing.seller_phone, '[^0-9]', '', 'g')
)
WHERE listing.seller_phone IS NOT NULL
  AND (
      SELECT COUNT(*)
      FROM users account
      WHERE regexp_replace(account.phone, '[^0-9]', '', 'g')
          = regexp_replace(listing.seller_phone, '[^0-9]', '', 'g')
  ) = 1;
