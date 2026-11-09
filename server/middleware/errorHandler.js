/**
 * Global Error Handler Middleware (middleware/errorHandler.js)
 * -------------------------------------------------------------
 * Catches unhandled errors thrown in route handlers and controllers.
 * Translates PostgreSQL error codes into friendly user messages and
 * prevents internal server crash or leakage of sensitive server traces.
 */

// Handle requests to unknown routes (404 Not Found)
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

// Global error handling middleware (must have 4 arguments: err, req, res, next)
const globalErrorHandler = (err, req, res, next) => {
  console.error('⚠️ Unhandled Application Error:', err);

  // PostgreSQL unique violation error (e.g., duplicate email)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this information already exists.',
      detail: err.detail,
    });
  }

  // PostgreSQL invalid input syntax error (e.g., passing string for integer ID)
  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Invalid input format for database field.',
    });
  }

  // PostgreSQL foreign key violation (e.g., user_id doesn't exist)
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  // Express body-parser JSON syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body.',
    });
  }

  // Default internal server error (500)
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error. Please try again later.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
