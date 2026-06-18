-- Add screensaver audio toggle to masjids table
-- 0 = off, 1 = on (default)
ALTER TABLE masjids
  ADD COLUMN screensaver_audio_enabled INT NOT NULL DEFAULT 1
  COMMENT 'Toggle audio Quran saat mode hemat. 0=off, 1=on';
