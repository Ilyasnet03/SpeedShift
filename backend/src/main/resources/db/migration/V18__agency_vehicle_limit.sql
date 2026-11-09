ALTER TABLE users ADD COLUMN rental_vehicle_limit INTEGER NOT NULL DEFAULT 5;
ALTER TABLE users ADD CONSTRAINT users_rental_vehicle_limit_positive CHECK (rental_vehicle_limit > 0);
