import mysql from 'mysql2/promise';

async function run() {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL not set');
    
    console.log('Connecting to DB...');
    const connection = await mysql.createConnection(url);
    
    try {
        console.log('Adding force_reload column to devices...');
        await connection.execute('ALTER TABLE `devices` ADD COLUMN `force_reload` int DEFAULT 0 NOT NULL');
        console.log('Success!');
    } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
        } else {
            console.error('Error:', err.message);
        }
    } finally {
        await connection.end();
    }
}

run();
