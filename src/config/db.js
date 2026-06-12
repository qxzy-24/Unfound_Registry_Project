const mysql = require('mysql2');

// --- CONFIGURE DATABASE CONNECTION ---
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'unfound_registry'
};
const pool = mysql.createPool(dbConfig);
const db = pool.promise(); // Reusable promise-based pool

module.exports = { pool, db };
