
/**
 * Database Initialization Script (scripts/initDb.js)
 * --------------------------------------------------
 * Reads schema.sql and creates the required database
 * tables and indexes if they do not already exist.
 *
 * Usage:
 *   node scripts/initDb.js
 *   or: npm run init-db
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initializeDatabase() {
  console.log('🔄 Initializing Sweety Glucose Tracker database schema...');

  const schemaPath = path.join(__dirname, 'schema.sql');

  try {
    // Read SQL schema file
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema SQL
    await pool.query(schemaSql);

    console.log('✅ Database schema initialized successfully!');
    console.log('   - Table created or verified: users');
    console.log('   - Table created or verified: glucose_readings');
    console.log('   - Indexes created or verified');
  } catch (error) {
    console.error('❌ Failed to initialize database schema:');
    console.error(error.message);

    if (error.code === '3D000') {
      console.error(
        '👉 Database does not exist. Create sweety_glucose_db first.'
      );
    }

    throw error;
  } finally {
    await pool.end();
  }
}

// Run script directly
if (require.main === module) {
  initializeDatabase().catch(() => {
    process.exitCode = 1;
  });
}

module.exports = initializeDatabase;
