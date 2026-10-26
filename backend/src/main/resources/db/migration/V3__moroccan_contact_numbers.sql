UPDATE listings
SET seller_phone = regexp_replace(seller_phone, '^\+33\s*([67])', '+212\1')
WHERE seller_phone ~ '^\+33\s*[67]';

UPDATE users
SET phone = regexp_replace(phone, '^\+33\s*([67])', '+212\1')
WHERE phone ~ '^\+33\s*[67]';
