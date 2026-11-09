
import api from './api';

// Register a new user
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Login existing user
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);

  // Save JWT token after successful login
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }

  return response.data;
};

// Get logged-in user profile
export const getUserProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('token');
};
