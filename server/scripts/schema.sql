
-- ====================================================================
-- Sweety Glucose Tracker - PostgreSQL Database Schema
-- ====================================================================

-- 1. Users Table
-- Stores user accounts and hashed passwords.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 2. Glucose Readings Table
-- Stores glucose readings associated with a specific user.

CREATE TABLE IF NOT EXISTS glucose_readings (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    glucose_level INTEGER NOT NULL
        CHECK (glucose_level BETWEEN 40 AND 600),

    unit VARCHAR(10) NOT NULL DEFAULT 'mg/dL'
        CHECK (unit = 'mg/dL'),

    meal_context VARCHAR(30) NOT NULL
        CHECK (
            meal_context IN (
                'morning',
                'after_breakfast',
                'after_lunch',
                'after_dinner'
            )
        ),

    measured_at TIMESTAMP WITH TIME ZONE NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    notes TEXT
        CHECK (notes IS NULL OR CHAR_LENGTH(notes) <= 500),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 3. Indexes for query performance

CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_id
    ON glucose_readings(user_id);

CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_measured_at
    ON glucose_readings(user_id, measured_at DESC);


-- 4. Prevent duplicate readings for the same user,
--    measurement slot and calendar day (India Standard Time).

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_daily_meal_context
ON glucose_readings (
    user_id,
    ((measured_at AT TIME ZONE 'Asia/Kolkata')::date),
    meal_context
);


-- ====================================================================
-- Database schema initialization completed.
-- ====================================================================
