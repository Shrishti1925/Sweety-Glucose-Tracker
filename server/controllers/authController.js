/**
 * Authentication Controller (controllers/authController.js)
 * ---------------------------------------------------------
 * Manages user authentication flows:
 *   - User registration (with bcrypt password hashing)
 *   - User login (verifying bcrypt hash and issuing JWT)
 *   - Fetching current authenticated user profile
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

// Salt rounds for bcrypt hashing (10 is industry standard: secure and performant)
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Generate a signed JWT token for an authenticated user.
 * @param {object} user - User payload { id, email }
 * @returns {string} Signed JWT
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'sweety_super_secret_jwt_key_2026_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    secret,
    { expiresIn }
  );
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if a user with this email already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists. Please log in or use a different email.',
      });
    }

    // Hash the plain text password securely using bcrypt
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Save user to the PostgreSQL database
    const newUser = await userModel.createUser({
      name,
      email,
      password: hashedPassword,
    });

    // Generate JWT token for immediate login after registration
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: newUser.created_at,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login an existing user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find the user by email in PostgreSQL
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare the submitted plain password against the stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Passwords match! Generate JWT token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile of currently logged-in user
 * GET /api/auth/profile (Protected by authMiddleware)
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
