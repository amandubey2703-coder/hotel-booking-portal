const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00', // UTC date handling
  dateStrings: true,  // Return DATE columns as 'YYYY-MM-DD' strings
};

const pool = mysql.createPool(dbConfig);

// Test database connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (err) {
    console.error('MySQL connection error:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
};

