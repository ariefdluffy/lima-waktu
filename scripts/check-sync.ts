/**
 * Script debug: cek data masjid + sync jobs
 * Jalankan: npx tsx scripts/check-sync.ts
 */

import { readFileSync } from "fs";
import path from "path";
import mysql from "mysql2/promise";

// Parse .env manual
function loadEnv(...files: string[]) {
  for (const file of files) {
    try {
      const content = readFileSync(path.resolve(process.cwd(), file), "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed
          .slice(idx + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    } catch {
      // file tidak ada, skip
    }
  }
}

loadEnv(".env.local", ".env");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL!);

  console.log("\n=== MASJID AKTIF ===");
  const [masjids] = await conn.execute(
    `SELECT id, name, latitude, longitude, timezone, is_active
     FROM masjids
     WHERE is_active = 1`,
  );
  console.table(masjids);

  console.log("\n=== GLOBAL PRAYER CONFIG ===");
  const [config] = await conn.execute(
    `SELECT gpc.id, gpc.default_timezone, gpc.api_key,
            pp1.provider_key AS primary_provider_key, pp1.base_url AS primary_base_url,
            pp2.provider_key AS fallback_provider_key, pp2.base_url AS fallback_base_url,
            pcm.method_code, pcm.method_name
     FROM global_prayer_config gpc
     LEFT JOIN prayer_providers pp1 ON pp1.id = gpc.primary_provider_id
     LEFT JOIN prayer_providers pp2 ON pp2.id = gpc.fallback_provider_id
     LEFT JOIN prayer_calculation_methods pcm ON pcm.id = gpc.default_method_id
     WHERE gpc.id = 1`,
  );
  console.table(config);

  console.log("\n=== SYNC JOBS TERBARU (20 terakhir) ===");
  const [jobs] = await conn.execute(
    `SELECT sj.id, m.name AS masjid, sj.provider_key, sj.status,
            sj.error_message, sj.started_at, sj.finished_at
     FROM prayer_sync_jobs sj
     LEFT JOIN masjids m ON m.id = sj.masjid_id
     ORDER BY sj.id DESC
     LIMIT 20`,
  );
  console.table(jobs);

  console.log("\n=== PROVIDER LOGS ERROR TERBARU ===");
  const [logs] = await conn.execute(
    `SELECT pl.id, pp.provider_key, pl.request_path, pl.response_status,
            CAST(pl.response_payload AS CHAR) AS response_payload,
            pl.error_message, pl.created_at
     FROM prayer_provider_logs pl
     LEFT JOIN prayer_providers pp ON pp.id = pl.provider_id
     WHERE pl.response_status != 200
     ORDER BY pl.id DESC
     LIMIT 10`,
  );
  console.table(logs);

  console.log("\n=== SYNC JOBS FAILED (detail) ===");
  const [failedJobs] = await conn.execute(
    `SELECT sj.id, m.name AS masjid, sj.provider_key, sj.status,
            sj.error_message, sj.started_at
     FROM prayer_sync_jobs sj
     LEFT JOIN masjids m ON m.id = sj.masjid_id
     WHERE sj.status = 'failed'
     ORDER BY sj.id DESC
     LIMIT 20`,
  );
  console.table(failedJobs);

  console.log("\n=== PRAYER SCHEDULES PER MASJID ===");
  const [schedCount] = await conn.execute(
    `SELECT m.name, COUNT(ps.id) as total_schedules,
            MIN(ps.schedule_date) as earliest,
            MAX(ps.schedule_date) as latest,
            ps.source_provider
     FROM masjids m
     LEFT JOIN prayer_schedules ps ON ps.masjid_id = m.id
     WHERE m.is_active = 1
     GROUP BY m.id, m.name, ps.source_provider`,
  );
  console.table(schedCount);

  await conn.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
