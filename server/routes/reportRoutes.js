/**
 * Report Routes (routes/reportRoutes.js)
 * --------------------------------------
 * Endpoints for aggregated statistical summaries and trend data.
 * All routes require a valid JWT token via authMiddleware.
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateDailyReportQuery,
  validateMonthlyReportQuery,
} = require('../middleware/validationMiddleware');

// Require authentication for all report endpoints
router.use(authMiddleware);

// GET /api/reports/daily?date=YYYY-MM-DD - Get daily summary and readings breakdown
router.get('/daily', validateDailyReportQuery, reportController.getDailyReport);

// GET /api/reports/monthly?year=YYYY&month=M - Get monthly summary and daily trends
router.get('/monthly', validateMonthlyReportQuery, reportController.getMonthlyReport);
router.get('/periods', reportController.getPeriodReports);
module.exports = router;
