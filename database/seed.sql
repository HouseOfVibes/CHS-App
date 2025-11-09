-- Seed initial cities for CHS operations
INSERT INTO cities (name) VALUES
    ('Fulshear'),
    ('Missouri City'),
    ('Richmond'),
    ('South Houston'),
    ('Rosharon'),
    ('Meridiana'),
    ('Alvin'),
    ('Cypress'),
    ('Texas City'),
    ('Houston'),
    ('Katy')
ON CONFLICT (name) DO NOTHING;
