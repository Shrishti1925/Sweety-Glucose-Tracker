/**
 * Sweety Glucose Tracker - Server Entry Point (index.js)
 * ------------------------------------------------------
 * Main application bootstrap file:
 *   - Loads environment variables
 *   - Configures middleware (CORS, JSON parser)
 *   - Registers API routes
 *   - Configures error handling
 *   - Starts HTTP server on configured port
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const readingRoutes = require('./routes/readingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) so the React frontend can make requests
app.use(cors());

// Parse incoming requests with JSON payloads
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Sweety Glucose Tracker API is active and healthy',
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/reports', reportRoutes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(globalErrorHandler);

// Start server (only if run directly, allowing imports for testing)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log('====================================================');
    console.log(`🚀 Sweety Glucose Tracker Backend Server Started!`);
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log('====================================================');

    // Test database connection on boot
    await testConnection();
  });
}

module.exports = app;
