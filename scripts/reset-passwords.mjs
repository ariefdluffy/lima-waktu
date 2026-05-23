import { randomBytes, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Baca DATABASE_URL dari .env
const envPath = resolve(import.meta.dirname, "..", ".env");
const envContent = readFileSync(envPath, "utf-8");
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) throw new Error("DATABASE_URL not found in .env");
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
  [passwordHash, "superadmin@limawaktu.local"]
);
console.log(`superadmin updated: ${r1.affectedRows} row(s)`);

// Update admin
const [r2] = await conn.execute(
  "UPDATE users SET password_hash = ? WHERE email = ?",
  [passwordHash, "admin@masjid.local"]
);
console.log(`admin updated: ${r2.affectedRows} row(s)`);

await conn.end();
console.log("Done!");
