import { randomBytes, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Tentukan environment (default: .env.local jika ada, else .env)
let envPath = resolve(import.meta.dirname, "..", ".env.local");
let envContent;

try {
  envContent = readFileSync(envPath, "utf-8");
} catch {
  // Fallback ke .env jika .env.local tidak ada
  envPath = resolve(import.meta.dirname, "..", ".env");
  envContent = readFileSync(envPath, "utf-8");
}

console.log(`Using environment file: ${envPath}`);

// Baca DATABASE_URL
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) throw new Error("DATABASE_URL not found in environment file");
const DATABASE_URL = match[1].trim();

// Hash password pakai scrypt (sama kayak di password.ts)
const SALT_LEN = 16;
const HASH_LEN = 64;
const password = "change_me";
const salt = randomBytes(SALT_LEN).toString("hex");
const hash = scryptSync(password, salt, HASH_LEN).toString("hex");
const passwordHash = `${salt}:${hash}`;

console.log("Hashed password:", passwordHash);

// Konek ke DB
const conn = await mysql.createConnection(DATABASE_URL);

// Update superadmin
const [r1] = await conn.execute(
  "UPDATE users SET password_hash = ? WHERE email = ?",
  [passwordHash, "superadmin@limawaktu.local"],
);
console.log(`superadmin updated: ${r1.affectedRows} row(s)`);

// Update admin
const [r2] = await conn.execute(
  "UPDATE users SET password_hash = ? WHERE email = ?",
  [passwordHash, "admin@masjid.local"],
);
console.log(`admin updated: ${r2.affectedRows} row(s)`);

await conn.end();
console.log("Done!");
