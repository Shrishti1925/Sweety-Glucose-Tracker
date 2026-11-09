/**
 * JWT Authentication Middleware (middleware/authMiddleware.js)
 * -------------------------------------------------------------
 * Protects private endpoints by verifying the JSON Web Token (JWT) sent
 * in the HTTP "Authorization" header formatted as: "Bearer <token>".
 *
 * If valid, it attaches the decoded user payload to `req.user` and calls `next()`.
 * If missing, invalid, or expired, it immediately responds with an HTTP 401 Unauthorized.
 */

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is present
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization header provided.',
      });
    }

    // Check if header follows the standard "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Format must be: Bearer <token>',
      });
    }

    const token = parts[1];

    // Verify token using secret key
    const secret = process.env.JWT_SECRET || 'sweety_super_secret_jwt_key_2026_change_in_production';
    const decoded = jwt.verify(token, secret);

    // Attach user information to request object for downstream controllers
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authorization denied.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
