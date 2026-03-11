const fs = require('fs');
const path = require('path');
const { createPool } = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  const pool = createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.getConnection();
    
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema...');
    await client.query(schema);
    
    console.log('Database schema initialized successfully!');
    
    client.release();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initializeDatabase };
