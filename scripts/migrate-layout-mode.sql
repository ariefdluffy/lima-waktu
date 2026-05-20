ALTER TABLE devices
  ADD COLUMN layout_mode ENUM('default','youtube') NOT NULL DEFAULT 'default'
  AFTER is_active;
