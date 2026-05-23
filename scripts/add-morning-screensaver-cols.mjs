import { createConnection } from "mysql2/promise";

const conn = await createConnection(process.env.DATABASE_URL);

// Check existing columns first
const [cols] = await conn.execute(
  "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'masjids' AND TABLE_SCHEMA = DATABASE()",
);
const existing = cols.map((c) => c.COLUMN_NAME);

if (!existing.includes("screensaver_morning_delay_minutes")) {
  await conn.execute(
    "ALTER TABLE masjids ADD COLUMN screensaver_morning_delay_minutes int NOT NULL DEFAULT 60",
  );
  console.log("✅ screensaver_morning_delay_minutes added");
} else {
  console.log("⏭️ screensaver_morning_delay_minutes already exists");
}

if (!existing.includes("screensaver_morning_wake_minutes")) {
  await conn.execute(
    "ALTER TABLE masjids ADD COLUMN screensaver_morning_wake_minutes int NOT NULL DEFAULT 120",
  );
  console.log("✅ screensaver_morning_wake_minutes added");
} else {
  console.log("⏭️ screensaver_morning_wake_minutes already exists");
}

await conn.end();
