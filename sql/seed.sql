-- sql/seed.sql
-- Insert a sample daily verse
INSERT INTO daily_verses (reference, text) VALUES
('Psalm 23:1', 'The Lord is my shepherd; I shall not want.')
ON CONFLICT DO NOTHING;

-- Insert sample events
INSERT INTO events (title, description, start_at, location) VALUES
('Sunday Service', 'Main Sunday service', now() + interval '2 days', 'Main Hall')
ON CONFLICT DO NOTHING;

-- Sample memorial with images array
INSERT INTO memorials (title, description, images) VALUES
('2024 Memorial', 'Photos from memorial', '[{"url":"https://i.pravatar.cc/300?img=4","public_id":"mem1"}]')
ON CONFLICT DO NOTHING;