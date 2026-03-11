const { createPool } = require('mysql2/promise');
require('dotenv').config();

class DatabaseConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseConnectionError';
    this.statusCode = 503;
  }
}

let pool = null;

function createDatabasePool() {
  if (pool) {
    return pool;
  }

  pool = createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });

  return pool;
}

async function getConnection() {
  try {
    const dbPool = createDatabasePool();
    const client = await dbPool.getConnection();
    return client;
  } catch (error) {
    console.error('Failed to get database connection:', error);
    throw new DatabaseConnectionError('Database connection unavailable. Please try again later.');
  }
}

async function query(sql, params) {
  const client = await getConnection();
  try {
    const result = await client.query(sql, params);
    return {
      rows: result[0],
      rowCount: result[0].length
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function checkHealth() {
  try {
    const result = await query('SELECT NOW() as now');
    return {
      healthy: true,
      timestamp: result.rows[0].now,
      message: 'Database connection is healthy'
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      message: 'Database connection failed'
    };
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getConnection,
  query,
  checkHealth,
  closePool,
  DatabaseConnectionError
};
