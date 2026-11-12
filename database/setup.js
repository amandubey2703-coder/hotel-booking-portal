/**
 * Cross-platform Database Setup Script
 * Executes schema.sql and seed.sql using mysql2
 */
const fs = require('fs');
const path = require('path');

// Resolve modules from backend/node_modules
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'hotel_booking';

async function runSetup() {
  console.log(`Connecting to MySQL server at ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);
  
  // Connect to MySQL server without selecting database first
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    console.log(`Ensuring database '${DB_NAME}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.query(`USE \`${DB_NAME}\`;`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    console.log(`Executing schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('Schema executed successfully.');

    console.log(`Executing seed data from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);
    console.log('Seed data inserted successfully.');

    console.log('Database setup complete!');
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  runSetup();
}

module.exports = runSetup;
