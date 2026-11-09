
/**
 * Reports Controller (controllers/reportController.js)
 * ----------------------------------------------------
 * Generates aggregated statistical reports for glucose readings:
 * 1. Daily Report
 * 2. Monthly Report
 * 3. Month-to-date and Previous Full Month Reports
 */

const readingModel = require('../models/readingModel');

/**
 * Get current date formatted as YYYY-MM-DD in IST.
 */
const getTodayDateString = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const dateParts = {};

  parts.forEach((part) => {
    if (part.type !== 'literal') {
      dateParts[part.type] = part.value;
    }
  });

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

/**
 * Month names lookup.
 */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Generate daily glucose summary report.
 * GET /api/reports/daily?date=YYYY-MM-DD
 */
const getDailyReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const targetDate = req.query.date || getTodayDateString();

    const reportData = await readingModel.getDailyReport(
      userId,
      targetDate
    );

    const summary = reportData.summary;
    const totalCount = summary.count || 0;

    const inRangePercentage = totalCount > 0
      ? Math.round((summary.in_range_count / totalCount) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      date: targetDate,
      summary: {
        total_readings: totalCount,
        average_glucose: summary.average_glucose,
        min_glucose: summary.min_glucose,
        max_glucose: summary.max_glucose,
        low_count: summary.low_count || 0,
        in_range_count: summary.in_range_count || 0,
        high_count: summary.high_count || 0,
        in_range_percentage: inRangePercentage,
      },
      meal_breakdown: reportData.meal_breakdown,
      readings: reportData.readings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate monthly glucose trends and statistical report.
 * GET /api/reports/monthly?year=2026&month=11
 */
const getMonthlyReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = getTodayDateString();
    const [currentYear, currentMonth] = today.split('-').map(Number);

    const year = req.query.year
      ? parseInt(req.query.year, 10)
      : currentYear;

    const month = req.query.month
      ? parseInt(req.query.month, 10)
      : currentMonth;

    const reportData = await readingModel.getMonthlyReport(
      userId,
      year,
      month
    );

    const summary = reportData.summary;
    const totalReadings = summary.total_readings || 0;

    const inRangePercentage = totalReadings > 0
      ? Math.round((summary.normal_count / totalReadings) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      year,
      month,
      month_name: MONTH_NAMES[month - 1] || '',
      summary: {
        total_readings: totalReadings,
        average_glucose: summary.average_glucose,
        lowest_reading: summary.lowest_reading,
        highest_reading: summary.highest_reading,
        hypoglycemia_count: summary.hypoglycemia_count || 0,
        normal_count: summary.normal_count || 0,
        hyperglycemia_count: summary.hyperglycemia_count || 0,
        in_range_percentage: inRangePercentage,
      },
      meal_distribution: reportData.meal_distribution,
      daily_trends: reportData.daily_trends,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate month-to-date and previous full-month reports.
 * GET /api/reports/periods
 */
const getPeriodReports = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = getTodayDateString();

    const [year, month, day] = today.split('-').map(Number);

    // Month-to-date: first day of current month to tomorrow.
    const currentMonthStart =
      `${year}-${String(month).padStart(2, '0')}-01`;

    const tomorrow = new Date(
      Date.UTC(year, month - 1, day + 1)
    ).toISOString().slice(0, 10);

    // Previous full month.
    const previousMonthLastDate = new Date(
      Date.UTC(year, month - 1, 0)
    );

    const previousMonthYear =
      previousMonthLastDate.getUTCFullYear();

    const previousMonth =
      previousMonthLastDate.getUTCMonth() + 1;

    const previousMonthStart =
      `${previousMonthYear}-${String(previousMonth).padStart(2, '0')}-01`;

    const previousMonthEnd =
      previousMonthLastDate.toISOString().slice(0, 10);

    const [monthToDateData, previousMonthData] = await Promise.all([
      readingModel.getMonthlyReportForRange(
        userId,
        currentMonthStart,
        tomorrow
      ),
      readingModel.getMonthlyReportForRange(
        userId,
        previousMonthStart,
        currentMonthStart
      ),
    ]);

    const formatReport = (data, startDate, endDate) => {
      const summary = data.summary;
      const total = summary.total_readings || 0;

      return {
        start_date: startDate,
        end_date: endDate,
        summary: {
          total_readings: total,
          average_glucose: summary.average_glucose,
          lowest_reading: summary.lowest_reading,
          highest_reading: summary.highest_reading,
          hypoglycemia_count: summary.hypoglycemia_count || 0,
          normal_count: summary.normal_count || 0,
          hyperglycemia_count: summary.hyperglycemia_count || 0,
          in_range_percentage: total > 0
            ? Math.round((summary.normal_count / total) * 100)
            : 0,
        },
        meal_distribution: data.meal_distribution,
        daily_trends: data.daily_trends,
      };
    };

    return res.status(200).json({
      success: true,
      month_to_date: formatReport(
        monthToDateData,
        currentMonthStart,
        today
      ),
      previous_full_month: formatReport(
        previousMonthData,
        previousMonthStart,
        previousMonthEnd
      ),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getPeriodReports,
};
