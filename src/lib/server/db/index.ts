import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { env } from "$env/dynamic/private";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

// Pool dikonfigurasi eksplisit supaya tidak memakai default mysql2 yang
// rawan menyumbat saat banyak Display TV polling bersamaan.
//
// - connectionLimit dinaikkan dari 10 → 20 untuk menyangga banyak device.
// - waitForConnections=true: query baru ngantri rapi alih-alih error.
// - connectTimeout 8s: hindari TCP handshake menggantung berjam-jam.
// - enableKeepAlive + keepAliveInitialDelay: cegah firewall/MySQL `wait_timeout`
//   memutus koneksi idle secara diam-diam (penyebab slow query "pertama" tiap pagi).
// - idleTimeout + maxIdle: koneksi idle dipulihkan secara berkala.
const client = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: 20,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 8000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  idleTimeout: 60_000,
  maxIdle: 10,
});

export const db = drizzle(client, { schema, mode: "default" });
