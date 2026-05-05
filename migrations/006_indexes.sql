CREATE INDEX IF NOT EXISTS idx_events_updated_at ON events(updated_at);
CREATE INDEX IF NOT EXISTS idx_matches_updated_at ON matches(updated_at);
CREATE INDEX IF NOT EXISTS idx_albums_updated_at ON albums(updated_at);
CREATE INDEX IF NOT EXISTS idx_city_info_updated_at ON city_info(updated_at);
