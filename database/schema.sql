-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cities table
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subdivisions table
CREATE TABLE subdivisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(city_id, name)
);

-- Homes table
CREATE TABLE homes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    subdivision_id UUID REFERENCES subdivisions(id) ON DELETE SET NULL,
    street_name TEXT NOT NULL,
    address TEXT NOT NULL,
    result TEXT CHECK (result IN (
        'Not Home',
        'Scheduled Demo',
        'DND (Do Not Disturb)',
        'Already Has System',
        'Not Interested',
        'Interested - Call Back',
        'Sold/Closed'
    )),
    contact_name TEXT,
    phone_number TEXT,
    follow_up_date DATE,
    notes TEXT,
    canvasser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    date_visited DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'corelogic')),
    corelogic_id TEXT UNIQUE,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    location_pinned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(address, city_id)
);

-- CoreLogic sync log (Phase 2)
CREATE TABLE corelogic_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    records_fetched INTEGER,
    records_added INTEGER,
    status TEXT CHECK (status IN ('success', 'error', 'partial')),
    error_message TEXT
);

-- Create indexes for better query performance
CREATE INDEX idx_homes_city_id ON homes(city_id);
CREATE INDEX idx_homes_subdivision_id ON homes(subdivision_id);
CREATE INDEX idx_homes_date_visited ON homes(date_visited);
CREATE INDEX idx_homes_result ON homes(result);
CREATE INDEX idx_homes_canvasser_id ON homes(canvasser_id);
CREATE INDEX idx_subdivisions_city_id ON subdivisions(city_id);

-- Enable Row Level Security
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE subdivisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for now, allow all authenticated users)
-- Phase 1: Single user (AJ)
-- Phase 3: Will update for multi-user

CREATE POLICY "Allow all for authenticated users" ON cities
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON subdivisions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON homes
    FOR ALL USING (auth.role() = 'authenticated');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to homes table
CREATE TRIGGER update_homes_updated_at
    BEFORE UPDATE ON homes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
