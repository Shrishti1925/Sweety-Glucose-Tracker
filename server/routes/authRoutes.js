/**
 * Authentication Routes (routes/authRoutes.js)
 * --------------------------------------------
 * Endpoints for user registration, authentication, and user profile.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateRegister,
  validateLogin,
} = require('../middleware/validationMiddleware');

// Public route: Register a new account
// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// Public route: Log in to an existing account
// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// Protected route: Fetch current user profile
// GET /api/auth/profile
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
