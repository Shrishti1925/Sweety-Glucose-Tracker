/**
 * Database Configuration (config/db.js)
 * -------------------------------------
 * This file establishes a connection pool to the PostgreSQL database using the 'pg' library.
 * Using a connection pool improves performance by reusing active database connections
 * rather than opening and closing a new connection on every incoming API request.
 */

const { Pool } = require('pg');
require('dotenv').config();

// Build connection configuration.
// Supports both a single DATABASE_URL or individual connection variables.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'sweety_glucose_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection cannot be established
    };

const pool = new Pool(poolConfig);

// Listen for unexpected errors on idle database clients to prevent crashes
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Helper function to run SQL queries using the connection pool.
 * @param {string} text - SQL query string with parameter placeholders ($1, $2, etc.)
 * @param {Array} params - Array of parameter values matching placeholders
 * @returns {Promise<object>} Query result from pg
 */
const query = (text, params) => pool.query(text, params);

/**
 * Diagnostic function to test the database connection when the server boots.
 * Provides clear and beginner-friendly troubleshooting steps if connection fails.
 */
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() AS current_time');
    console.log('✅ PostgreSQL connected successfully at:', res.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    console.error('👉 Troubleshooting Tips:');
    console.error('   1. Ensure PostgreSQL service is running on your machine.');
    console.error(`   2. Ensure the database "${poolConfig.database || 'sweety_glucose_db'}" exists.`);
    console.error('   3. Check credentials (DB_USER, DB_PASSWORD, DB_PORT) in your .env file.');
    return false;
  }
};

module.exports = {
  pool,
  query,
  testConnection,
};
