
import api from './api';

// Add a new glucose reading
export const createReading = async (readingData) => {
  const response = await api.post('/readings', readingData);
  return response.data;
};

// Get all glucose readings
export const getReadings = async (params = {}) => {
  const response = await api.get('/readings', { params });
  return response.data;
};

// Get a single reading by ID
export const getReadingById = async (id) => {
  const response = await api.get(`/readings/${id}`);
  return response.data;
};

// Update an existing reading
export const updateReading = async (id, readingData) => {
  const response = await api.put(`/readings/${id}`, readingData);
  return response.data;
};

// Delete a reading
export const deleteReading = async (id) => {
  const response = await api.delete(`/readings/${id}`);
  return response.data;
};
