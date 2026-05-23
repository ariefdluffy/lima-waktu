/**
 * db-restore.mjs
 * Restore data dari fail JSON backup ke database baru.
 * Auto-run schema migrations (drizzle) sebelum restore.
 *
 * Cara guna:
 *   node --env-file=.env.local scripts/db-restore.mjs --in=./backup/backup-xxx.json
 *   node --env-file=.env.local scripts/db-restore.mjs --in=./backup/backup-xxx.json --truncate
 *
 * Flag:
 *   --in=<path>   Path ke fail backup JSON (wajib)
 *   --truncate    Kosongkan table dulu sebelum insert (optional, default: false)
 *   --dry-run     Simulate sahaja, tiada data ditulis ke DB
 */

import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL belum terisi. Jalankan: node --env-file=.env.local scripts/db-restore.mjs --in=<path>",
  );
}

// Parse arguments
const inArg = process.argv.find((a) => a.startsWith("--in="));
const doTruncate = process.argv.includes("--truncate");
const dryRun = process.argv.includes("--dry-run");

if (!inArg) {
  throw new Error(
    "Argument --in diperlukan. Contoh: --in=./backup/backup-xxx.json",
  );
}

const inFile = path.resolve(inArg.replace("--in=", ""));

console.log(`📂 Membaca fail backup: ${inFile}`);
const raw = await fs.readFile(inFile, "utf-8");
const backup = JSON.parse(raw);

console.log(`   Backup dibuat pada : ${backup.meta.createdAt}`);
console.log(`   Sumber DB          : ${backup.meta.databaseUrl}`);
console.log(
  `   Mod                : ${dryRun ? "DRY RUN (tiada tulis)" : doTruncate ? "TRUNCATE + INSERT" : "INSERT (skip duplikat)"}`,
);
console.log("");

// ============================================================
// Langkah 1: Auto-run schema migrations jika table belum wujud
// ============================================================
const conn = await mysql.createConnection(databaseUrl);

async function ensureSchema() {
  // Check if any table from backup exists
  const tables = Object.keys(backup.data).filter(
    (t) => backup.data[t]?.length > 0,
  );
  if (tables.length === 0) return; // nothing to check

  const [existingTables] = await conn.query("SHOW TABLES");
  const existingSet = new Set(
    Object.values(existingTables[0] ?? {}).length
      ? existingTables.map((r) => Object.values(r)[0])
      : [],
  );

  const missing = tables.filter((t) => !existingSet.has(t));
  if (missing.length === 0) {
    console.log("   ✅ Schema sudah wujud, skip migration.\n");
    return;
  }

  // Read _journal.json untuk order migrations
  const journalPath = path.join(
    PROJECT_ROOT,
    "drizzle",
    "meta",
    "_journal.json",
  );
  let journal;
  try {
    const journalRaw = await fs.readFile(journalPath, "utf-8");
    journal = JSON.parse(journalRaw);
  } catch {
    console.warn(
      "   ⚠️  Cannot read drizzle journal. Running drizzle-kit push as fallback.\n",
    );
    await runDrizzlePush();
    return;
  }

  console.log(
    `   ⚠️  ${missing.length} table tidak wujud. Menjalankan schema migrations...\n`,
  );

  for (const entry of journal.entries) {
    const sqlFile = path.join(PROJECT_ROOT, "drizzle", `${entry.tag}.sql`);
    let sql;
    try {
      sql = await fs.readFile(sqlFile, "utf-8");
    } catch {
      console.warn(`   ⚠️  Cannot read migration: ${entry.tag}.sql — skip`);
      continue;
    }

    // Split by "--> statement-breakpoint" for multi-statement files
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        await conn.query(stmt);
      } catch (err) {
        // Ignore "already exists" errors — safe for re-runs
        const msg = err.message.toLowerCase();
        if (
          msg.includes("already exists") ||
          msg.includes("duplicate") ||
          msg.includes("already in use")
        ) {
          continue;
        }
        throw err;
      }
    }
    console.log(`   ✅ Migration: ${entry.tag}.sql`);
  }

  console.log("");
}

async function runDrizzlePush() {
  // Fallback: spawn drizzle-kit push
  const { execSync } = await import("child_process");
  try {
    console.log("   🔄 Running: npm run db:push");
    execSync("npm run db:push", {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    console.log("");
  } catch (err) {
    console.error("   ❌ drizzle-kit push failed:", err.message);
    console.error("   Jalankan manual: npm run db:push");
    throw err;
  }
}

if (!dryRun) {
  await ensureSchema();
} else {
  console.log("🔍 DRY RUN — skip schema check.\n");
}

// ============================================================
// Langkah 2: Restore data
// ============================================================
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

if (dryRun) {
  console.log("🔍 DRY RUN — tiada perubahan dibuat ke database.\n");
  for (const [table, rows] of Object.entries(backup.data)) {
    console.log(
      `  📋 ${table.padEnd(40)} ${rows.length} baris akan di-restore`,
    );
  }
  console.log("\n✅ Dry run selesai.");
  await conn.end();
  process.exit(0);
}

// Disable FK checks semasa restore supaya urutan insert tidak menyebabkan error
await conn.query("SET FOREIGN_KEY_CHECKS = 0");
await conn.query("SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO'");

console.log("🔄 Memulakan restore...\n");

let totalInserted = 0;
let totalSkipped = 0;

// Restore mengikut urutan yang ditetapkan, kemudian table lain yang ada dalam backup
const tablesToRestore = [
  ...TABLE_ORDER.filter((t) => backup.data[t] !== undefined),
  ...Object.keys(backup.data).filter((t) => !TABLE_ORDER.includes(t)),
];

for (const table of tablesToRestore) {
  const rows = backup.data[table];

  if (!rows || rows.length === 0) {
    console.log(`  ⏭️  ${table.padEnd(40)} kosong, skip`);
    continue;
  }

  try {
    if (doTruncate) {
      await conn.query(`TRUNCATE TABLE \`${table}\``);
    }

    // Chunk insert — 200 baris setiap batch untuk elak packet terlalu besar
    const CHUNK_SIZE = 200;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const columns = Object.keys(chunk[0])
        .map((c) => `\`${c}\``)
        .join(", ");
      const placeholders = chunk
        .map(
          (row) =>
            `(${Object.keys(row)
              .map(() => "?")
              .join(", ")})`,
        )
        .join(", ");
      const values = chunk.flatMap((row) =>
        Object.values(row).map((v) => {
          // Drizzle JSON fields disimpan sebagai object — serialize balik
          if (v !== null && typeof v === "object" && !(v instanceof Date)) {
            return JSON.stringify(v);
          }
          return v;
        }),
      );

      await conn.query(
        `INSERT IGNORE INTO \`${table}\` (${columns}) VALUES ${placeholders}`,
        values,
      );
      inserted += chunk.length;
    }

    totalInserted += inserted;
    console.log(`  ✅ ${table.padEnd(40)} ${inserted} baris di-insert`);
  } catch (err) {
    console.error(`  ❌ ${table.padEnd(40)} GAGAL: ${err.message}`);
    totalSkipped += rows.length;
  }
}

// Pulihkan FK checks
await conn.query("SET FOREIGN_KEY_CHECKS = 1");
await conn.end();

console.log(`\n✅ Restore selesai!`);
console.log(`   Di-insert : ${totalInserted} baris`);
console.log(`   Gagal/Skip: ${totalSkipped} baris`);
if (totalSkipped > 0) {
  console.log(`   ⚠️  Semak error di atas untuk baris yang gagal.`);
}
