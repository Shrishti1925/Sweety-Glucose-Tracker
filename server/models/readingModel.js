
/**
 * Glucose Reading Model (models/readingModel.js)
 * ------------------------------------------------
 * Handles all database operations for glucose_readings.
 * All queries enforce user isolation using user_id.
 */

const { query } = require('../config/db');

/**
 * Insert a new glucose reading.
 */
const createReading = async ({
  userId,
  glucoseLevel,
  unit = 'mg/dL',
  mealContext,
  measuredAt = new Date(),
  notes = null,
}) => {
  const sql = `
    INSERT INTO glucose_readings
      (user_id, glucose_level, unit, meal_context, measured_at, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, user_id, glucose_level, unit, meal_context,
              measured_at, notes, created_at, updated_at;
  `;

  const values = [
    userId,
    glucoseLevel,
    unit,
    mealContext,
    measuredAt,
    notes,
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Fetch readings for a user with optional filters and pagination.
 */
const getReadingsByUserId = async (userId, filters = {}) => {
  const {
    startDate,
    endDate,
    mealContext,
    limit = 50,
    offset = 0,
  } = filters;

  const conditions = ['user_id = $1'];
  const values = [userId];
  let paramIndex = 2;

  if (startDate) {
    conditions.push(`measured_at >= $${paramIndex}`);
    values.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`measured_at <= $${paramIndex}`);
    values.push(endDate);
    paramIndex++;
  }

  if (mealContext) {
    conditions.push(`meal_context = $${paramIndex}`);
    values.push(mealContext);
    paramIndex++;
  }

  values.push(limit);
  const limitIndex = paramIndex++;

  values.push(offset);
  const offsetIndex = paramIndex++;

  const sql = `
    SELECT id, user_id, glucose_level, unit, meal_context,
           measured_at, notes, created_at, updated_at
    FROM glucose_readings
    WHERE ${conditions.join(' AND ')}
    ORDER BY measured_at DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
  `;

  const result = await query(sql, values);
  return result.rows;
};

/**
 * Count readings matching the given filters.
 */
const countReadingsByUserId = async (userId, filters = {}) => {
  const { startDate, endDate, mealContext } = filters;

  const conditions = ['user_id = $1'];
  const values = [userId];
  let paramIndex = 2;

  if (startDate) {
    conditions.push(`measured_at >= $${paramIndex}`);
    values.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`measured_at <= $${paramIndex}`);
    values.push(endDate);
    paramIndex++;
  }

  if (mealContext) {
    conditions.push(`meal_context = $${paramIndex}`);
    values.push(mealContext);
    paramIndex++;
  }

  const sql = `
    SELECT COUNT(*) AS total
    FROM glucose_readings
    WHERE ${conditions.join(' AND ')};
  `;

  const result = await query(sql, values);
  return parseInt(result.rows[0].total, 10);
};

/**
 * Get one reading belonging to a specific user.
 */
const getReadingByIdAndUserId = async (id, userId) => {
  const sql = `
    SELECT id, user_id, glucose_level, unit, meal_context,
           measured_at, notes, created_at, updated_at
    FROM glucose_readings
    WHERE id = $1 AND user_id = $2
    LIMIT 1;
  `;

  const result = await query(sql, [id, userId]);
  return result.rows[0] || null;
};

/**
 * Update an existing reading belonging to the user.
 */
const updateReading = async (id, userId, updates = {}) => {
  // Unit is intentionally excluded because this application
  // supports only mg/dL.
  const allowedFields = [
    'glucose_level',
    'meal_context',
    'measured_at',
    'notes',
  ];

  const setClauses = [];
  const values = [id, userId];
  let paramIndex = 3;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex}`);
      values.push(updates[field]);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return getReadingByIdAndUserId(id, userId);
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');

  const sql = `
    UPDATE glucose_readings
    SET ${setClauses.join(', ')}
    WHERE id = $1 AND user_id = $2
    RETURNING id, user_id, glucose_level, unit, meal_context,
              measured_at, notes, created_at, updated_at;
  `;

  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Delete a reading belonging to the user.
 */
const deleteReading = async (id, userId) => {
  const sql = `
    DELETE FROM glucose_readings
    WHERE id = $1 AND user_id = $2
    RETURNING id;
  `;

  const result = await query(sql, [id, userId]);
  return result.rowCount > 0;
};

/**
 * Get statistics and readings for one day.
 * Date boundaries are interpreted in Asia/Kolkata.
 */
const getDailyReport = async (userId, dateStr) => {
  const statsSql = `
    SELECT
      COUNT(*)::int AS count,
      ROUND(AVG(glucose_level), 1)::float AS average_glucose,
      MIN(glucose_level)::float AS min_glucose,
      MAX(glucose_level)::float AS max_glucose,
      COUNT(CASE WHEN glucose_level < 70 THEN 1 END)::int AS low_count,
      COUNT(CASE WHEN glucose_level >= 70 AND glucose_level <= 140 THEN 1 END)::int AS in_range_count,
      COUNT(CASE WHEN glucose_level > 140 THEN 1 END)::int AS high_count
    FROM glucose_readings
    WHERE user_id = $1
      AND measured_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
      AND measured_at < (($2::date + INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Kolkata');
  `;

  const mealBreakdownSql = `
    SELECT
      meal_context,
      COUNT(*)::int AS count,
      ROUND(AVG(glucose_level), 1)::float AS avg_glucose,
      MIN(glucose_level)::float AS min_glucose,
      MAX(glucose_level)::float AS max_glucose
    FROM glucose_readings
    WHERE user_id = $1
      AND measured_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
      AND measured_at < (($2::date + INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Kolkata')
    GROUP BY meal_context
    ORDER BY meal_context ASC;
  `;

  const readingsSql = `
    SELECT id, glucose_level, unit, meal_context,
           measured_at, notes, created_at
    FROM glucose_readings
    WHERE user_id = $1
      AND measured_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
      AND measured_at < (($2::date + INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Kolkata')
    ORDER BY measured_at ASC;
  `;

  const [statsResult, breakdownResult, readingsResult] =
    await Promise.all([
      query(statsSql, [userId, dateStr]),
      query(mealBreakdownSql, [userId, dateStr]),
      query(readingsSql, [userId, dateStr]),
    ]);

  return {
    date: dateStr,
    summary: statsResult.rows[0],
    meal_breakdown: breakdownResult.rows,
    readings: readingsResult.rows,
  };
};

/**
 * Get statistics and daily trends for a specific month.
 * Month is 1-12. Date boundaries use Asia/Kolkata.
 */
const getMonthlyReport = async (userId, year, month) => {
  const padMonth = String(month).padStart(2, '0');
  const startDateStr = `${year}-${padMonth}-01`;

  const nextMonthDate = new Date(year, month, 1);

  const endDateStr = `${nextMonthDate.getFullYear()}-${String(
    nextMonthDate.getMonth() + 1
  ).padStart(2, '0')}-01`;

  const overallSql = `
    SELECT
      COUNT(*)::int AS total_readings,
      ROUND(AVG(glucose_level), 1)::float AS average_glucose,
      MIN(glucose_level)::float AS lowest_reading,
      MAX(glucose_level)::float AS highest_reading,
      COUNT(CASE WHEN glucose_level < 70 THEN 1 END)::int AS hypoglycemia_count,
      COUNT(CASE WHEN glucose_level >= 70 AND glucose_level <= 140 THEN 1 END)::int AS normal_count,
      COUNT(CASE WHEN glucose_level > 140 THEN 1 END)::int AS hyperglycemia_count
    FROM glucose_readings
    WHERE user_id = $1
      AND measured_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
      AND measured_at < ($3::date::timestamp AT TIME ZONE 'Asia/Kolkata');
  `;

  const dailyTrendsSql = `
    SELECT
      TO_CHAR(day_date, 'YYYY-MM-DD') AS date,
      COUNT(*)::int AS readings_count,
      ROUND(AVG(glucose_level), 1)::float AS avg_glucose,
      MIN(glucose_level)::float AS min_glucose,
      MAX(glucose_level)::float AS max_glucose
    FROM (
      SELECT
        (measured_at AT TIME ZONE 'Asia/Kolkata')::date AS day_date,
        glucose_level
      FROM glucose_readings
      WHERE user_id = $1
        AND measured_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
        AND measured_at < ($3::date::timestamp AT TIME ZONE 'Asia/Kolkata')
    ) AS daily_readings
    GROUP BY day_date
    ORDER BY day_date ASC;
  `;

  const mealDistributionSql = `
    SELECT
      meal_context,
      COUNT(*)::int AS count,
      ROUND(AVG(glucose_level), 1)::float AS avg_glucose
    FROM glucose_readings
    WHERE user_id = $1
      AND measured_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
      AND measured_at < ($3::date::timestamp AT TIME ZONE 'Asia/Kolkata')
    GROUP BY meal_context
    ORDER BY count DESC;
  `;

  const values = [userId, startDateStr, endDateStr];

  const [overallResult, dailyTrendsResult, mealDistResult] =
    await Promise.all([
      query(overallSql, values),
      query(dailyTrendsSql, values),
      query(mealDistributionSql, values),
    ]);

  return {
    year,
    month,
    summary: overallResult.rows[0],
    meal_distribution: mealDistResult.rows,
    daily_trends: dailyTrendsResult.rows,
  };
};

/**
 * Get report statistics for a custom date range.
 * End date is exclusive. Dates use India Standard Time.
 */
const getMonthlyReportForRange = async (
  userId,
  startDate,
  endDateExclusive
) => {
  const overallSql = `
    SELECT
      COUNT(*)::int AS total_readings,
      ROUND(AVG(glucose_level), 1)::float AS average_glucose,
      MIN(glucose_level)::float AS lowest_reading,
      MAX(glucose_level)::float AS highest_reading,
      COUNT(CASE WHEN glucose_level < 70 THEN 1 END)::int AS hypoglycemia_count,
      COUNT(CASE WHEN glucose_level >= 70 AND glucose_level <= 140 THEN 1 END)::int AS normal_count,
      COUNT(CASE WHEN glucose_level > 140 THEN 1 END)::int AS hyperglycemia_count
    FROM glucose_readings
    WHERE user_id = $1
      AND measured_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
      AND measured_at < ($3::date::timestamp AT TIME ZONE 'Asia/Kolkata');
  `;

  const dailyTrendsSql = `
    SELECT
      TO_CHAR(day_date, 'YYYY-MM-DD') AS date,
      COUNT(*)::int AS readings_count,
      ROUND(AVG(glucose_level), 1)::float AS avg_glucose,
      MIN(glucose_level)::float AS min_glucose,
      MAX(glucose_level)::float AS max_glucose
    FROM (
      SELECT
        (measured_at AT TIME ZONE 'Asia/Kolkata')::date AS day_date,
        glucose_level
      FROM glucose_readings
      WHERE user_id = $1
        AND measured_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
        AND measured_at < ($3::date::timestamp AT TIME ZONE 'Asia/Kolkata')
    ) AS daily_readings
    GROUP BY day_date
    ORDER BY day_date ASC;
  `;

  const mealDistributionSql = `
    SELECT
      meal_context,
      COUNT(*)::int AS count,
      ROUND(AVG(glucose_level), 1)::float AS avg_glucose
    FROM glucose_readings
    WHERE user_id = $1
      AND measured_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Kolkata')
      AND measured_at < ($3::date::timestamp AT TIME ZONE 'Asia/Kolkata')
    GROUP BY meal_context
    ORDER BY count DESC;
  `;

  const values = [userId, startDate, endDateExclusive];

  const [overallResult, dailyTrendsResult, mealDistResult] =
    await Promise.all([
      query(overallSql, values),
      query(dailyTrendsSql, values),
      query(mealDistributionSql, values),
    ]);

  return {
    summary: overallResult.rows[0],
    meal_distribution: mealDistResult.rows,
    daily_trends: dailyTrendsResult.rows,
  };
};

module.exports = {
  createReading,
  getReadingsByUserId,
  countReadingsByUserId,
  getReadingByIdAndUserId,
  updateReading,
  deleteReading,
  getDailyReport,
  getMonthlyReport,
  getMonthlyReportForRange,
};
