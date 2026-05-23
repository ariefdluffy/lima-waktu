/**
 * db-export-sql.mjs
 * Baca backup JSON + drizzle migrations → generate file SQL lengkap.
 * Idempoten — jalanin berkali-kali hasilnya sama.
 *
 * Cara guna:
 *   node scripts/db-export-sql.mjs --in=./backup/backup-superadmin-final.json --out=./backup/limawaktu-full.sql
 *   mysql -u root -p < backup/limawaktu-full.sql
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Parse arguments
const inArg = process.argv.find((a) => a.startsWith("--in="));
const outArg = process.argv.find((a) => a.startsWith("--out="));

if (!inArg) throw new Error("--in=<path> diperlukan");
const inFile = path.resolve(inArg.replace("--in=", ""));
const outFile = outArg
  ? path.resolve(outArg.replace("--out=", ""))
  : path.resolve(PROJECT_ROOT, "backup", "limawaktu-full.sql");

// ============================================================
// 1. Baca backup JSON
// ============================================================
console.log(`📂 Baca backup: ${inFile}`);
const raw = await fs.readFile(inFile, "utf-8");
const backup = JSON.parse(raw);

// ============================================================
// 2. Baca & urutkan migration files dari _journal.json
// ============================================================
const journalPath = path.join(PROJECT_ROOT, "drizzle", "meta", "_journal.json");
const journalRaw = await fs.readFile(journalPath, "utf-8");
const journal = JSON.parse(journalRaw);

// ============================================================
// 3. Build SQL
// ============================================================
const lines = [];

// Header
lines.push("-- ============================================================");
lines.push(`-- LIMAAKTU Full Database Dump`);
lines.push(`-- Generated : ${new Date().toISOString()}`);
lines.push(`-- Source    : ${path.basename(inFile)}`);
lines.push(`-- Backup    : ${backup.meta.createdAt}`);
lines.push("-- ============================================================");
lines.push("");

// Create database
lines.push("-- Buat database");
lines.push("CREATE DATABASE IF NOT EXISTS `limawaktu_db`");
lines.push("  CHARACTER SET utf8mb4");
lines.push("  COLLATE utf8mb4_unicode_ci;");
lines.push("");
lines.push("USE `limawaktu_db`;");
lines.push("");

// Disable FK checks during import
lines.push("SET FOREIGN_KEY_CHECKS = 0;");
lines.push("SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO';");
lines.push("");

// ---- Drop existing tables (reverse FK order = child first) ----
lines.push("-- ============================================================");
lines.push("-- Drop existing tables (idempotent — skip if not exist)");
lines.push("-- ============================================================");
lines.push("");

const TABLE_ORDER = [
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

// Reverse: drop child tables first to avoid FK issues
const REVERSE_ORDER = [...TABLE_ORDER].reverse();
for (const table of REVERSE_ORDER) {
  lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
}
lines.push("");

// ---- Schema: execute all migration files in order ----
lines.push("-- ============================================================");
lines.push("-- Schema Migrations");
lines.push("-- ============================================================");
lines.push("");

for (const entry of journal.entries) {
  const sqlFile = path.join(PROJECT_ROOT, "drizzle", `${entry.tag}.sql`);
  let sqlContent;
  try {
    sqlContent = await fs.readFile(sqlFile, "utf-8");
  } catch {
    console.warn(`  ⚠️  Skip ${entry.tag}.sql — not found`);
    continue;
  }

  // Split multi-statement
  const statements = sqlContent
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  lines.push(`-- Migration: ${entry.tag}.sql`);
  for (const stmt of statements) {
    let processed = stmt.trim();

    // CREATE TABLE → CREATE TABLE IF NOT EXISTS (idempotent)
    if (/^CREATE\s+TABLE\s+/i.test(processed)) {
      processed = processed.replace(
        /^(CREATE\s+TABLE)\s+/i,
        "$1 IF NOT EXISTS ",
      );
    }

    lines.push(processed + ";");
  }
  lines.push("");
}

// ---- Schema fixes: columns ada di backup tapi missing from migrations ----
lines.push("-- ============================================================");
lines.push("-- Schema Fixes (kolom yang ada di backup tapi belum di-migrasi)");
lines.push("-- ============================================================");
lines.push("");

// khusuk_screen_duration: ada di schema.ts tapi tidak ada migration file
// yang menambahkannya ke tabel masjids
lines.push(
  "ALTER TABLE `masjids` ADD COLUMN `khusuk_screen_duration` int NOT NULL DEFAULT 10;",
);
lines.push("");

// ---- Seed fixes: data missing dari backup ----
lines.push("-- ============================================================");
lines.push("-- Seed Fixes (data yang harus ada tapi missing dari backup)");
lines.push("-- ============================================================");
lines.push("");

// Role "admin" (code='admin') — dipakai query superadmin/admins
// Backup cuma punya "superadmin" dan "admin_masjid"
lines.push(
  "INSERT IGNORE INTO `roles` (`id`, `code`, `name`, `description`, `created_at`, `updated_at`) VALUES",
);
lines.push(
  "(3, 'admin', 'Admin', 'Pengelola masjid terdaftar', NOW(), NOW());",
);
lines.push("");

// Beri role "admin" ke user yang sudah punya role "admin_masjid"
lines.push(
  "INSERT IGNORE INTO `user_roles` (`user_id`, `role_id`, `created_at`, `updated_at`)",
);
lines.push("VALUES");
lines.push(
  "('00000000-0000-0000-0000-000000000002', 3, NOW(), NOW()), -- admin@masjid.local",
);
lines.push(
  "('7862bbe1-34d7-4973-a7b1-f9dd04392c71', 3, NOW(), NOW()); -- arieftheluffy@gmail.com",
);
lines.push("");

// ---- Data: convert JSON rows to INSERT statements ----
lines.push("-- ============================================================");
lines.push("-- Data Restore");
lines.push("-- ============================================================");
lines.push("");

function escapeSqlValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";

  let str = String(val);

  // If it's an object (JSON field), serialize
  if (typeof val === "object" && !(val instanceof Date)) {
    str = JSON.stringify(val);
  }

  // Escape single quotes and backslashes
  str = str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  return `'${str}'`;
}

const tablesToExport = [
  ...TABLE_ORDER.filter((t) => backup.data[t] !== undefined),
  ...Object.keys(backup.data).filter((t) => !TABLE_ORDER.includes(t)),
];

for (const table of tablesToExport) {
  const rows = backup.data[table];
  if (!rows || rows.length === 0) {
    lines.push(`-- ${table}: 0 rows (skip)`);
    lines.push("");
    continue;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `\`${c}\``).join(", ");

  lines.push(`-- ${table}: ${rows.length} rows`);
  lines.push(`INSERT IGNORE INTO \`${table}\` (${colList}) VALUES`);

  const valueLines = rows.map((row, idx) => {
    const vals = columns.map((c) => escapeSqlValue(row[c])).join(", ");
    const comma = idx < rows.length - 1 ? "," : ";";
    return `(${vals})${comma}`;
  });

  lines.push(...valueLines);
  lines.push("");
}

// Re-enable FK checks
lines.push("SET FOREIGN_KEY_CHECKS = 1;");
lines.push("");

lines.push("-- ============================================================");
lines.push("-- Selesai");
lines.push("-- ============================================================");

// ============================================================
// 4. Write output
// ============================================================
const sql = lines.join("\n");
await fs.mkdir(path.dirname(outFile), { recursive: true });
await fs.writeFile(outFile, sql, "utf-8");

const totalRows = tablesToExport.reduce(
  (s, t) => s + (backup.data[t]?.length || 0),
  0,
);
console.log(`✅ SQL file generated:`);
console.log(`   File    : ${outFile}`);
console.log(`   Tables  : ${tablesToExport.length}`);
console.log(`   Rows    : ${totalRows}`);
