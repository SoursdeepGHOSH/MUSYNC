const mysql = require('mysql2/promise');

// MySQL connection pool configuration
// Uses XAMPP's MySQL on default port 3306
const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '', // Default XAMPP MySQL has no password
    database: 'music_library',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
