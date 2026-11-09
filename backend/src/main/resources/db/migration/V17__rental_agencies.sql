CREATE TABLE rental_agencies (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    logo VARCHAR(1000),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    description VARCHAR(2000) NOT NULL
);

CREATE TABLE rental_vehicles (
    id BIGSERIAL PRIMARY KEY,
    agency_id BIGINT NOT NULL REFERENCES rental_agencies(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    vehicle_year INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    daily_price NUMERIC(12,2) NOT NULL,
    fuel VARCHAR(30) NOT NULL,
    transmission VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE rental_vehicle_photos (
    vehicle_id BIGINT NOT NULL REFERENCES rental_vehicles(id) ON DELETE CASCADE,
    photo_order INTEGER NOT NULL,
    url VARCHAR(1000) NOT NULL,
    PRIMARY KEY (vehicle_id, photo_order)
);

CREATE INDEX rental_vehicles_agency_status_idx ON rental_vehicles(agency_id, status);
