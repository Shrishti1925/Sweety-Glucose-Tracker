/**
 * User Model (models/userModel.js)
 * --------------------------------
 * Handles all database operations for the "users" table.
 * Isolating SQL queries inside models keeps controllers clean and maintainable.
 */

const { query } = require('../config/db');

/**
 * Insert a new user into the database.
 * @param {object} userData
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's unique email address
 * @param {string} userData.password - Pre-hashed password
 * @returns {Promise<object>} The newly created user record (excluding password)
 */
const createUser = async ({ name, email, password }) => {
  const sql = `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, created_at, updated_at;
  `;
  const result = await query(sql, [name.trim(), email.trim().toLowerCase(), password]);
  return result.rows[0];
};

/**
 * Find a user by their email address.
 * Includes the hashed password for authentication verification.
 * @param {string} email - The email to search for
 * @returns {Promise<object|null>} The user object or null if not found
 */
const findByEmail = async (email) => {
  const sql = `
    SELECT id, name, email, password, created_at, updated_at
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;
  const result = await query(sql, [email.trim().toLowerCase()]);
  return result.rows[0] || null;
};

/**
 * Find a user by their primary key ID (excludes password).
 * @param {number} id - The user ID
 * @returns {Promise<object|null>} The user record without password or null
 */
const findById = async (id) => {
  const sql = `
    SELECT id, name, email, created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1;
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

module.exports = {
  createUser,
  findByEmail,
  findById,
};
