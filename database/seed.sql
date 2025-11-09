-- Seed initial cities for CHS operations
INSERT INTO cities (name) VALUES
    ('Alvin'),
    ('Angleton'),
    ('Brazoria'),
    ('Clute'),
    ('Cypress'),
    ('Freeport'),
    ('Fulshear'),
    ('Houston'),
    ('Iowa Colony'),
    ('Katy'),
    ('Lake Jackson'),
    ('Manvel'),
    ('Meridiana'),
    ('Missouri City'),
    ('Pearland'),
    ('Richmond'),
    ('Rosharon'),
    ('South Houston'),
    ('Sugar Land'),
    ('Sweeny'),
    ('Texas City'),
    ('West Columbia')
ON CONFLICT (name) DO NOTHING;

-- Seed common subdivisions for each city
-- Note: You'll need to get the city_id from the cities table after running the above insert
-- This is a helper query to get city IDs for the subdivision inserts below:
-- SELECT id, name FROM cities ORDER BY name;

-- Example subdivisions (you can customize these based on actual areas you service)
-- Uncomment and update the city_id values after running the cities insert above

-- INSERT INTO subdivisions (name, city_id) VALUES
--     -- Fulshear subdivisions
--     ('Cross Creek Ranch', (SELECT id FROM cities WHERE name = 'Fulshear')),
--     ('Jordan Ranch', (SELECT id FROM cities WHERE name = 'Fulshear')),
--     ('Weston Lakes', (SELECT id FROM cities WHERE name = 'Fulshear')),
--
--     -- Katy subdivisions
--     ('Grand Lakes', (SELECT id FROM cities WHERE name = 'Katy')),
--     ('Cinco Ranch', (SELECT id FROM cities WHERE name = 'Katy')),
--     ('Seven Meadows', (SELECT id FROM cities WHERE name = 'Katy')),
--
--     -- Cypress subdivisions
--     ('Bridgeland', (SELECT id FROM cities WHERE name = 'Cypress')),
--     ('Towne Lake', (SELECT id FROM cities WHERE name = 'Cypress')),
--     ('Cypress Creek Lakes', (SELECT id FROM cities WHERE name = 'Cypress')),
--
--     -- Missouri City subdivisions
--     ('Sienna Plantation', (SELECT id FROM cities WHERE name = 'Missouri City')),
--     ('Lake Olympia', (SELECT id FROM cities WHERE name = 'Missouri City')),
--     ('Riverstone', (SELECT id FROM cities WHERE name = 'Missouri City'))
-- ON CONFLICT (name, city_id) DO NOTHING;
