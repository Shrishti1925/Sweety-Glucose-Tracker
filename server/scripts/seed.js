
/**
 * Seed Script (scripts/seed.js)
 * Creates a demo user and sample glucose readings.
 */

const bcrypt = require('bcrypt');
const { query } = require('../config/db');

const DEMO_EMAIL = 'demo@sweety.com';
const DEMO_PASSWORD = 'Demo@123456';

const getISTDate = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = {};
  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding Sweety database...');

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    let userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [DEMO_EMAIL]
    );

    let userId;

    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;

      await query(
        'UPDATE users SET name = $1, password = $2 WHERE id = $3',
        ['Sweety Demo User', hashedPassword, userId]
      );
    } else {
      userResult = await query(
        `INSERT INTO users (name, email, password)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['Sweety Demo User', DEMO_EMAIL, hashedPassword]
      );

      userId = userResult.rows[0].id;
    }

    // Remove previous demo readings so rerunning this script
    // does not create duplicate sample data.
    await query(
      'DELETE FROM glucose_readings WHERE user_id = $1',
      [userId]
    );

    const sampleReadings = [
      [getISTDate(2), 'morning', 105, 'Demo fasting reading'],
      [getISTDate(2), 'after_breakfast', 135, 'Demo after breakfast'],
      [getISTDate(1), 'morning', 112, 'Demo fasting reading'],
      [getISTDate(0), 'morning', 125, 'Demo fasting reading'],
      [getISTDate(0), 'after_lunch', 145, 'Demo after lunch'],
    ];

    for (const [date, mealContext, glucoseLevel, notes] of sampleReadings) {
      await query(
        `INSERT INTO glucose_readings
          (user_id, glucose_level, unit, meal_context, measured_at, notes)
         VALUES ($1, $2, 'mg/dL', $3, $4::date::timestamp + TIME '08:00', $5)`,
        [userId, glucoseLevel, mealContext, date, notes]
      );
    }

    console.log('✅ Demo user and sample readings created!');
    console.log('Demo email:', DEMO_EMAIL);
    console.log('Demo password:', DEMO_PASSWORD);
    console.log('Sample readings:', sampleReadings.length);
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    // Close the database connection pool.
    const { pool } = require('../config/db');
    if (pool) await pool.end();
  }
};

seedDatabase();
