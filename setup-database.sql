-- ============================================================
--  MOVIE DAY 2026 — DATABASE SETUP
--  Run this in: Supabase Dashboard → SQL Editor
--  Project: bdryeyawnjvgovfsqaxv
-- ============================================================

-- 1. Create the registrations table
CREATE TABLE IF NOT EXISTS movie_registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     TEXT UNIQUE NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  english_level TEXT NOT NULL,
  branch        TEXT NOT NULL,
  seat          TEXT UNIQUE,   -- e.g. "A5" — UNIQUE prevents double-booking
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for fast seat availability checks
CREATE INDEX IF NOT EXISTS idx_movie_reg_seat ON movie_registrations(seat);

-- 3. Enable Row Level Security
ALTER TABLE movie_registrations ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous users to register (INSERT)
CREATE POLICY "allow_public_insert" ON movie_registrations
  FOR INSERT TO anon WITH CHECK (true);

-- 5. Allow anyone to read seat data (for the live seat map)
CREATE POLICY "allow_public_select" ON movie_registrations
  FOR SELECT TO anon USING (true);

-- 6. Allow service role full access (admin operations)
CREATE POLICY "allow_service_all" ON movie_registrations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Allow anon to delete (admin uses anon key in HTML — for delete button)
--    Remove this if you want delete to be server-side only
CREATE POLICY "allow_anon_delete" ON movie_registrations
  FOR DELETE TO anon USING (true);

-- Done! ✅
SELECT 'Movie Day 2026 database ready! 🎬' AS status;
