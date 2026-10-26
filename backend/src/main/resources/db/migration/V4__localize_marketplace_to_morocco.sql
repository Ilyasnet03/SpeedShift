ALTER TABLE listings
    ALTER COLUMN image_url TYPE TEXT;

UPDATE listings
SET country_code = 'MA'
WHERE country_code = 'FR';

UPDATE listings
SET city = CASE city
    WHEN 'Paris' THEN 'Casablanca'
    WHEN 'Lyon' THEN 'Rabat'
    WHEN 'Marseille' THEN 'Agadir'
    WHEN 'Nantes' THEN 'Marrakech'
    WHEN 'Bordeaux' THEN 'Tanger'
    WHEN 'Toulouse' THEN 'Fès'
    WHEN 'Nice' THEN 'Meknès'
    ELSE city
END
WHERE city IN ('Paris', 'Lyon', 'Marseille', 'Nantes', 'Bordeaux', 'Toulouse', 'Nice');

UPDATE listings
SET seller_phone = regexp_replace(seller_phone, '^\+212([67])', '+212 \1')
WHERE seller_phone ~ '^\+212[67]';

UPDATE listings
SET price = ROUND(price * 10.8, 2)
WHERE title IN (
    'BMW M3 Competition',
    'Yamaha R1 2024',
    'Sea-Doo Spark TRIXX',
    'Can-Am Maverick X3',
    'Audi RS6',
    'Kawasaki Ninja ZX-6R',
    'Porsche 911 Carrera'
)
AND seller_name IN ('Luc', 'Nicolas', 'Claire', 'Mathieu', 'Sophie', 'Amandine', 'Romain');

UPDATE listings
SET seller_name = CASE seller_name
    WHEN 'Luc' THEN 'Youssef'
    WHEN 'Nicolas' THEN 'Amine'
    WHEN 'Claire' THEN 'Salma'
    WHEN 'Mathieu' THEN 'Hamza'
    WHEN 'Sophie' THEN 'Imane'
    WHEN 'Amandine' THEN 'Khalid'
    WHEN 'Romain' THEN 'Nour'
    ELSE seller_name
END
WHERE seller_name IN ('Luc', 'Nicolas', 'Claire', 'Mathieu', 'Sophie', 'Amandine', 'Romain');
