/**
 * Glucose Reading Routes (routes/readingRoutes.js)
 * ------------------------------------------------
 * Endpoints for CRUD operations on glucose readings.
 * All routes require a valid JWT token via authMiddleware.
 */

const express = require('express');
const router = express.Router();
const readingController = require('../controllers/readingController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateCreateReading,
  validateUpdateReading,
} = require('../middleware/validationMiddleware');

// Require authentication for all reading endpoints
router.use(authMiddleware);

// POST /api/readings - Add a new reading
router.post('/', validateCreateReading, readingController.createReading);

// GET /api/readings - Get readings with optional filtering & pagination
router.get('/', readingController.getReadings);

// GET /api/readings/:id - Get a specific reading
router.get('/:id', readingController.getReadingById);

// PUT /api/readings/:id - Update an existing reading
router.put('/:id', validateUpdateReading, readingController.updateReading);

// DELETE /api/readings/:id - Delete a reading
router.delete('/:id', readingController.deleteReading);

module.exports = router;
