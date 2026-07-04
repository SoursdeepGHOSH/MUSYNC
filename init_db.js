const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    try {
        console.log('Connecting to MySQL...');
        // Connect without database selected first
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            multipleStatements: true // Important for running the SQL script
        });

        console.log('Connected to MySQL. Reading schema...');
        const sqlPath = path.join(__dirname, 'sql', 'music_library.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing schema...');
        await connection.query(sql);

        console.log('Database initialized successfully!');
        await connection.end();
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        process.exit(1);
    }
}

initDatabase();
