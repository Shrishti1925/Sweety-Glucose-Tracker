
import api from './api';

// Get daily glucose report
export const getDailyReport = async (date) => {
  const response = await api.get('/reports/daily', {
    params: date ? { date } : {},
  });

  return response.data;
};

// Get monthly glucose report
export const getMonthlyReport = async (year, month) => {
  const response = await api.get('/reports/monthly', {
    params: { year, month },
  });

  return response.data;
};

// Get month-to-date and previous full month reports
export const getPeriodReports = async () => {
  const response = await api.get('/reports/periods');
  return response.data;
};
