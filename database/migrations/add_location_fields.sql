-- Migration: Add location fields to homes table
-- Run this if your database already exists and you need to add the new location columns

-- Add latitude column (8 decimal places for ~1.1mm precision)
ALTER TABLE homes ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8);

-- Add longitude column (8 decimal places for ~1.1mm precision)
ALTER TABLE homes ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Add location_pinned_at timestamp column
ALTER TABLE homes ADD COLUMN IF NOT EXISTS location_pinned_at TIMESTAMP WITH TIME ZONE;

-- Optional: Add index for location-based queries (if you plan to do geo-searches)
-- CREATE INDEX IF NOT EXISTS idx_homes_location ON homes(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
