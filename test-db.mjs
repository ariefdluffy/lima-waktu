import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL belum terisi. Jalankan: node --env-file=.env.local test-db.mjs');
}

const connection = await mysql.createConnection(databaseUrl);

const [tables] = await connection.query('SHOW TABLES');
const [masjidRows] = await connection.query('SELECT COUNT(*) AS total FROM masjids');
const [scheduleRows] = await connection.query('SELECT COUNT(*) AS total FROM prayer_schedules');

console.log('Koneksi database: OK');
console.log('Jumlah tabel:', tables.length);
console.log('Jumlah data masjids:', masjidRows[0]?.total ?? 0);
console.log('Jumlah data prayer_schedules:', scheduleRows[0]?.total ?? 0);

await connection.end();
console.log('Selesai.');
