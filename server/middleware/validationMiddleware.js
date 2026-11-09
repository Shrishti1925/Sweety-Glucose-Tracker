
// Input Validation Middleware
// Validates request body and query parameters.

// Regular expression for email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Date format: YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Allowed glucose measurement slots
const ALLOWED_MEAL_CONTEXTS = [
  'morning',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
];

// Only mg/dL is supported
const ALLOWED_UNITS = ['mg/dL'];

// Check whether a date is a real calendar date
const isValidCalendarDate = (date) => {
  if (!DATE_REGEX.test(date)) return false;

  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

// Common validation response
const sendValidationErrors = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
};

// Validate registration
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Name is required.');
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Name must be between 2 and 100 characters long.');
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (password.length < 6 || password.length > 128) {
    errors.push('Password must be between 6 and 128 characters long.');
  }

  if (errors.length) return sendValidationErrors(res, errors);

  next();
};

// Validate login
const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || !password.length) {
    errors.push('Password is required.');
  }

  if (errors.length) return sendValidationErrors(res, errors);

  next();
};

// Validate glucose value
const validateGlucoseLevel = (value, errors) => {
  if (value === undefined || value === null || value === '') {
    errors.push('Glucose level is required.');
    return;
  }

  const numLevel = Number(value);

  if (!Number.isInteger(numLevel)) {
    errors.push('Glucose level must be an integer.');
  } else if (numLevel < 40 || numLevel > 600) {
    errors.push('Glucose level must be between 40 and 600 mg/dL.');
  }
};

// Validate measurement date
const validateMeasuredAt = (value, errors) => {
  if (value === undefined) return;

  if (typeof value !== 'string' || !value.trim()) {
    errors.push('measured_at must be a valid date and time string.');
    return;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    errors.push('measured_at must be a valid date and time string.');
  } else if (parsedDate.getTime() > Date.now()) {
    errors.push('Future measurement dates are not allowed.');
  }
};

// Validate meal slot
const validateMealContext = (value, errors) => {
  if (!value) {
    errors.push('Measurement slot is required.');
  } else if (!ALLOWED_MEAL_CONTEXTS.includes(value)) {
    errors.push(
      `Measurement slot must be one of: ${ALLOWED_MEAL_CONTEXTS.join(', ')}.`
    );
  }
};

// Validate notes
const validateNotes = (value, errors) => {
  if (value !== undefined && value !== null) {
    if (typeof value !== 'string') {
      errors.push('Notes must be a string.');
    } else if (value.length > 500) {
      errors.push('Notes cannot exceed 500 characters.');
    }
  }
};

// Validate creating a glucose reading
const validateCreateReading = (req, res, next) => {
  const {
    glucose_level,
    unit,
    meal_context,
    measured_at,
    notes,
  } = req.body || {};

  const errors = [];

  validateGlucoseLevel(glucose_level, errors);
  validateMealContext(meal_context, errors);
  validateMeasuredAt(measured_at, errors);
  validateNotes(notes, errors);

  if (unit !== undefined && !ALLOWED_UNITS.includes(unit)) {
    errors.push('Only mg/dL unit is supported.');
  }

  if (errors.length) return sendValidationErrors(res, errors);

  next();
};

// Validate updating an existing glucose reading
const validateUpdateReading = (req, res, next) => {
  const {
    glucose_level,
    unit,
    meal_context,
    measured_at,
    notes,
  } = req.body || {};

  const errors = [];

  const hasUpdateField = [
    glucose_level,
    unit,
    meal_context,
    measured_at,
    notes,
  ].some((value) => value !== undefined);

  if (!hasUpdateField) {
    return sendValidationErrors(res, [
      'Please provide at least one field to update.',
    ]);
  }

  // Unit cannot be changed
  if (unit !== undefined) {
    errors.push('Unit cannot be changed. Only mg/dL is supported.');
  }

  if (glucose_level !== undefined) {
    validateGlucoseLevel(glucose_level, errors);
  }

  if (meal_context !== undefined) {
    if (!ALLOWED_MEAL_CONTEXTS.includes(meal_context)) {
      errors.push(
        `Measurement slot must be one of: ${ALLOWED_MEAL_CONTEXTS.join(', ')}.`
      );
    }
  }

  validateMeasuredAt(measured_at, errors);
  validateNotes(notes, errors);

  if (errors.length) return sendValidationErrors(res, errors);

  next();
};

// Validate daily report date
const validateDailyReportQuery = (req, res, next) => {
  const { date } = req.query;

  if (date && !isValidCalendarDate(date)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date. Expected a real date in YYYY-MM-DD format.',
    });
  }

  next();
};

// Validate monthly report parameters
const validateMonthlyReportQuery = (req, res, next) => {
  const { year, month } = req.query;

  if (year !== undefined) {
    if (!/^\d{4}$/.test(year) || Number(year) < 2000 || Number(year) > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Year must be between 2000 and 2100.',
      });
    }
  }

  if (month !== undefined) {
    if (!/^(?:[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Month must be an integer between 1 and 12.',
      });
    }
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateReading,
  validateUpdateReading,
  validateDailyReportQuery,
  validateMonthlyReportQuery,
};
