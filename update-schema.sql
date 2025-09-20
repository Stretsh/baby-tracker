-- Update existing database to make food_type nullable
-- Run this in pgAdmin as the admin user

ALTER TABLE feeding_records ALTER COLUMN food_type DROP NOT NULL;
