-- Seed festival start/end dates so ScheduleCalendar has something to read.
-- Adjust dates as needed per year.
INSERT OR REPLACE INTO city_info (key, content_en, updated_at) VALUES
  ('festival_start', '2026-05-01', unixepoch()),
  ('festival_end',   '2026-05-11', unixepoch());
