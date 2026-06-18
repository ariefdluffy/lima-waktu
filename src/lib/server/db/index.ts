import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { env } from "$env/dynamic/private";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

// Pool dikonfigurasi eksplisit supaya tidak memakai default mysql2 yang
// rawan menyumbat saat banyak Display TV polling bersamaan.
//
// - connectionLimit dinaikkan 20 → 50 → 200: mysql2 v3 tidak support acquireTimeout,
//   jadi pool besar sebagai ganti — TV polling tidak habiskan semua koneksi.
// - waitForConnections=true: query ngantri rapi kalau semua koneksi kepakai.
// - queueLimit=0: antrean unlimited (default mysql2).
// - connectTimeout 8s: gagal cepat daripada TCP handshake gantung.
// - enableKeepAlive + keepAliveInitialDelay: cegah firewall/MySQL `wait_timeout`
//   memutus koneksi idle (penyebab slow query "pertama" tiap pagi).
// - idleTimeout + maxIdle: koneksi idle dipulihkan secara berkala.
const client = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: 200,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 8000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  idleTimeout: 60_000,
  maxIdle: 50,
} as mysql.PoolOptions);

export const db = drizzle(client, { schema, mode: "default" });
