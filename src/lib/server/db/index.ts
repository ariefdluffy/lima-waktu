import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { env } from "$env/dynamic/private";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

// Pool dikonfigurasi eksplisit supaya tidak memakai default mysql2 yang
// rawan menyumbat saat banyak Display TV polling bersamaan.
//
// - connectionLimit dinaikkan dari 20 → 50 untuk menyangga spike traffic.
// - waitForConnections=true: query baru ngantri rapi alih-alih error.
// - acquireTimeout 5s: gagal cepat jika pool habis, tidak nunggu 10s default.
// - connectTimeout 8s: hindari TCP handshake menggantung berjam-jam.
// - enableKeepAlive + keepAliveInitialDelay: cegah firewall/MySQL `wait_timeout`
//   memutus koneksi idle secara diam-diam (penyebab slow query "pertama" tiap pagi).
// - idleTimeout + maxIdle: koneksi idle dipulihkan secara berkala.
const client = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: 50,
  waitForConnections: true,
  acquireTimeout: 5000,
  queueLimit: 0,
  connectTimeout: 8000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  idleTimeout: 60_000,
  maxIdle: 10,
} as mysql.PoolOptions & { acquireTimeout: number });

export const db = drizzle(client, { schema, mode: "default" });
