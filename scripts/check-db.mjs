import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let url = process.env.DATABASE_URL;
if (!url) {
  const envContent = readFileSync(resolve(__dirname, "../.env"), "utf-8");
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (match) url = match[1].trim();
}

if (!url) throw new Error("DATABASE_URL not found");

const conn = await mysql.createPool(url);
const [rows] = await conn.query("SHOW COLUMNS FROM masjids");
const fields = rows.map((r) => r.Field);
console.log("masjids columns:", fields.join(", "));

if (!fields.includes("logo_url")) {
  console.log("logo_url missing — adding...");
  await conn.query("ALTER TABLE masjids ADD COLUMN logo_url varchar(500)");
  console.log("OK - column added");
} else {
  console.log("logo_url already exists");
}
await conn.end();
