import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL belum terisi. Jalankan: node --env-file=.env.local scripts/db-reset.mjs');
}

const parsed = new URL(databaseUrl);
const dbName = parsed.pathname.replace(/^\//, '');

if (!dbName) {
	throw new Error('Nama database tidak ditemukan di DATABASE_URL.');
}

const adminConnection = await mysql.createConnection({
	host: parsed.hostname,
	port: Number(parsed.port || 3306),
	user: decodeURIComponent(parsed.username),
	password: decodeURIComponent(parsed.password)
});

await adminConnection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
await adminConnection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await adminConnection.end();

console.log(`Database ${dbName} berhasil di-reset.`);
console.log('Lanjutkan dengan: npm run db:push:local');
