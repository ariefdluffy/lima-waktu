/**
 * db-backup.mjs
 * Export semua data dari database ke fail JSON.
 *
 * Cara guna:
 *   node --env-file=.env.local scripts/db-backup.mjs
 *   node --env-file=.env.local scripts/db-backup.mjs --out=./backup/my-backup.json
 */

import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL belum terisi. Jalankan: node --env-file=.env.local scripts/db-backup.mjs",
  );
}

// Parse --out argument
const outArg = process.argv.find((a) => a.startsWith("--out="));
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = outArg
  ? outArg.replace("--out=", "")
  : `./backup/backup-${timestamp}.json`;

// Senarai table mengikut urutan (parent dulu, child kemudian)
const TABLES = [
  "roles",
  "permissions",
  "role_permissions",
  "users",
  "user_sessions",
  "user_roles",
  "masjids",
  "masjid_users",
  "devices",
  "prayer_providers",
  "prayer_provider_logs",
  "prayer_calculation_methods",
  "prayer_schedules",
  "prayer_schedule_raw_sources",
  "prayer_corrections",
  "prayer_overrides",
  "prayer_sync_jobs",
  "iqamah_settings",
  "media_assets",
  "slides",
  "running_texts",
  "jumbotrons",
  "youtube_items",
  "events",
  "themes",
  "subscriptions",
  "invoices",
  "pricing_plans",
  "platform_announcements",
  "holiday_templates",
  "global_prayer_config",
  "audit_logs",
];

const conn = await mysql.createConnection(databaseUrl);

console.log("🔄 Memulakan backup...\n");

const backup = {
  meta: {
    createdAt: new Date().toISOString(),
    databaseUrl: databaseUrl.replace(/:\/\/.*@/, "://***:***@"), // sembunyikan credentials
    tables: [],
  },
  data: {},
};

for (const table of TABLES) {
  try {
    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    backup.data[table] = rows;
    backup.meta.tables.push({ name: table, rows: rows.length });
    console.log(`  ✅ ${table.padEnd(40)} ${rows.length} baris`);
  } catch (err) {
    // Table mungkin belum wujud — skip sahaja
    console.warn(`  ⚠️  ${table.padEnd(40)} SKIP (${err.message})`);
    backup.meta.tables.push({ name: table, rows: 0, skipped: true });
  }
}

await conn.end();

// Pastikan folder output wujud
await fs.mkdir(path.dirname(path.resolve(outFile)), { recursive: true });
await fs.writeFile(outFile, JSON.stringify(backup, null, 2), "utf-8");

const totalRows = backup.meta.tables.reduce((s, t) => s + t.rows, 0);
console.log(`\n✅ Backup selesai!`);
console.log(`   Fail  : ${path.resolve(outFile)}`);
console.log(`   Jumlah: ${totalRows} baris daripada ${TABLES.length} table`);
