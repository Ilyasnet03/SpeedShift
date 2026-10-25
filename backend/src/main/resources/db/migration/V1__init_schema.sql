CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    year INTEGER,
    mileage INTEGER,
    fuel VARCHAR(60),
    transmission VARCHAR(60),
    city VARCHAR(120),
    country_code VARCHAR(10),
    condition_field VARCHAR(50),
    image_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    price NUMERIC(12,2) NOT NULL,
    engine_power INTEGER,
    engine_displacement INTEGER,
    status VARCHAR(50),
    seller_name VARCHAR(150),
    seller_phone VARCHAR(50),
    verified BOOLEAN,
    seller_rating NUMERIC(3,2),
    views INTEGER,
    featured BOOLEAN,
    description TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

INSERT INTO listings (
    title, category, subcategory, brand, model, year, mileage, fuel, transmission, city, country_code,
    condition_field, image_url, thumbnail_url, price, engine_power, engine_displacement, status,
    seller_name, seller_phone, verified, seller_rating, views, featured, description, created_at, updated_at
) VALUES
('BMW M3 Competition', 'Voitures', 'Performance', 'BMW', 'M3', 2023, 18000, 'Essence', 'Automatique', 'Paris', 'FR', 'Excellent', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80', 72900.00, 510, 2998, 'published', 'Luc', '+33 6 12 34 56 78', true, 4.9, 184, true, 'BMW M3 Competition quasi neuve, suivi complet, pneus neufs, historique d’entretien disponible.', '2025-01-08 10:45:00', '2025-01-08 10:45:00'),
('Yamaha R1 2024', 'Motos', 'Sport', 'Yamaha', 'R1', 2024, 2800, 'Essence', 'Manuelle', 'Lyon', 'FR', 'Comme neuve', 'https://images.unsplash.com/photo-1558980664-10e7170b5df9?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1558980664-10e7170b5df9?auto=format&fit=crop&w=800&q=80', 19100.00, 200, 998, 'published', 'Nicolas', '+33 7 21 45 12 01', true, 4.8, 214, true, 'R1 2024 en parfait état, moteur fraîchement révisé, dépôt de garantie, équipements d’origine.', '2025-02-10 09:30:00', '2025-02-10 09:30:00'),
('Sea-Doo Spark TRIXX', 'Jet Skis', 'Plaisance', 'Sea-Doo', 'Spark TRIXX', 2022, 140, 'Essence', 'Auto', 'Marseille', 'FR', 'Très bon', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', 7800.00, 90, 899, 'published', 'Claire', '+33 6 77 11 44 08', true, 4.7, 156, true, 'Jet ski compact très fun, disponible avec remorque et kit de sécurité complet.', '2025-01-27 11:15:00', '2025-01-27 11:15:00'),
('Can-Am Maverick X3', 'Quads', 'Performance', 'Can-Am', 'Maverick X3', 2023, 620, 'Essence', 'Automatique', 'Nantes', 'FR', 'Excellent', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80', 26500.00, 172, 1721, 'pending', 'Mathieu', '+33 6 88 47 10 12', false, 4.5, 138, false, 'Quad ultra performant, réglage de suspension récente, documents complets.', '2025-03-02 14:20:00', '2025-03-02 14:20:00'),
('Audi RS6', 'Voitures', 'Sport', 'Audi', 'RS6', 2022, 43000, 'Diesel', 'Automatique', 'Bordeaux', 'FR', 'Très bon', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80', 91200.00, 600, 2894, 'published', 'Sophie', '+33 7 55 90 72 18', true, 4.9, 98, false, 'RS6 familiale avant-gardiste, châssis premium, entretien rigoureux et rapports techniques complets.', '2025-02-18 19:10:00', '2025-02-18 19:10:00'),
('Kawasaki Ninja ZX-6R', 'Motos', 'Sport', 'Kawasaki', 'ZX-6R', 2021, 9500, 'Essence', 'Manuelle', 'Toulouse', 'FR', 'Excellent', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3135?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1568772585407-9361f9bf3135?auto=format&fit=crop&w=800&q=80', 13950.00, 128, 636, 'published', 'Amandine', '+33 6 13 73 40 17', true, 4.8, 203, false, 'Ninja ZX-6R très racée avec équipement de route complet et carnet d’entretien.', '2025-03-08 08:35:00', '2025-03-08 08:35:00'),
('Porsche 911 Carrera', 'Voitures', 'Sport', 'Porsche', '911 Carrera', 2024, 5400, 'Essence', 'Automatique', 'Nice', 'FR', 'Comme neuve', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=80', 116500.00, 394, 2981, 'published', 'Romain', '+33 6 66 22 43 55', true, 5.0, 74, true, '911 Carrera en finition standard premium, historique complet, prête à rouler sans compromis.', '2025-03-15 12:00:00', '2025-03-15 12:00:00');
