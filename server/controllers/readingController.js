/**
 * Glucose Readings Controller (controllers/readingController.js)
 * -------------------------------------------------------------
 * Implements CRUD operations for blood glucose readings.
 * Ensures strict multi-tenant data isolation: every operation is scoped
 * to the authenticated user ID (`req.user.id`).
 */

const readingModel = require('../models/readingModel');

/**
 * Add a new glucose reading
 * POST /api/readings
 */

const createReading = async (req, res, next) => {
  try {
    const { glucose_level, meal_context, measured_at, notes } = req.body;
    const userId = req.user.id;

    const newReading = await readingModel.createReading({
      userId,
      glucoseLevel: Number(glucose_level),
      unit: 'mg/dL',
      mealContext: meal_context,
      measuredAt: measured_at ? new Date(measured_at) : new Date(),
      notes: notes ? notes.trim() : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Glucose reading added successfully!',
      reading: newReading,
    });
  } catch (error) {
    if (error.code === '23505' &&
        error.constraint === 'idx_unique_user_daily_meal_context') {
      return res.status(409).json({
        success: false,
        message: 'A reading for this measurement slot already exists on this date.',
      });
    }

    next(error);
  }
};


/**
 * Get all glucose readings for the authenticated user
 * Supports optional filtering: ?startDate=...&endDate=...&meal_context=...&limit=...&offset=...
 * GET /api/readings
 */
const getReadings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, meal_context, limit, offset } = req.query;

    // Sanitize pagination parameters
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const filterOptions = {
      startDate: startDate || null,
      endDate: endDate || null,
      mealContext: meal_context || null,
      limit: parsedLimit,
      offset: parsedOffset,
    };

    const [readings, total] = await Promise.all([
      readingModel.getReadingsByUserId(userId, filterOptions),
      readingModel.countReadingsByUserId(userId, filterOptions),
    ]);

    return res.status(200).json({
      success: true,
      count: readings.length,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      readings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single glucose reading by its ID
 * GET /api/readings/:id
 */
const getReadingById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);

    if (isNaN(readingId)) {
      return res.status(400).json({
        success: false,
        message: 'Reading ID must be a valid number.',
      });
    }

    const reading = await readingModel.getReadingByIdAndUserId(readingId, userId);
    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Glucose reading not found or you do not have permission to access it.',
      });
    }

    return res.status(200).json({
      success: true,
      reading,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing glucose reading
 * PUT /api/readings/:id
 */

const updateReading = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);

    if (isNaN(readingId)) {
      return res.status(400).json({
        success: false,
        message: 'Reading ID must be a valid number.',
      });
    }

    const { glucose_level, meal_context, measured_at, notes } = req.body;

    const updates = {};

    if (glucose_level !== undefined) {
      updates.glucose_level = Number(glucose_level);
    }

    if (meal_context !== undefined) {
      updates.meal_context = meal_context;
    }

    if (measured_at !== undefined) {
      updates.measured_at = new Date(measured_at);
    }

    if (notes !== undefined) {
      updates.notes = notes ? notes.trim() : null;
    }

    const updatedReading = await readingModel.updateReading(
      readingId,
      userId,
      updates
    );

    if (!updatedReading) {
      return res.status(404).json({
        success: false,
        message: 'Glucose reading not found or you do not have permission to update it.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Glucose reading updated successfully!',
      reading: updatedReading,
    });
  } catch (error) {
    if (error.code === '23505' &&
        error.constraint === 'idx_unique_user_daily_meal_context') {
      return res.status(409).json({
        success: false,
        message: 'A reading for this measurement slot already exists on this date.',
      });
    }

    next(error);
  }
};

/**
 * Delete a glucose reading
 * DELETE /api/readings/:id
 */
const deleteReading = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);

    if (isNaN(readingId)) {
      return res.status(400).json({
        success: false,
        message: 'Reading ID must be a valid number.',
      });
    }

    const isDeleted = await readingModel.deleteReading(readingId, userId);
    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Glucose reading not found or you do not have permission to delete it.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Glucose reading deleted successfully!',
      id: readingId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
};
