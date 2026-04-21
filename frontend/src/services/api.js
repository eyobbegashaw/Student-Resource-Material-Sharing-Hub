
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          localStorage.setItem('access_token', response.data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
};

// Universities API
export const universityAPI = {
  getAll: (params) => api.get('/universities/', { params }),
  getById: (id) => api.get(`/universities/${id}/`),
  getDepartments: (universityId) => api.get('/departments/', { params: { university: universityId } }),
  getCourses: (departmentId) => api.get('/courses/', { params: { department: departmentId } }),
};

// Resources API
export const resourcesAPI = {
  getAll: (params) => api.get('/resources/', { params }),
  getById: (id) => api.get(`/resources/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/resources/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => api.patch(`/resources/${id}/`, data),
  delete: (id) => api.delete(`/resources/${id}/`),
  download: (id) => api.post(`/resources/${id}/download/`),
  view: (id) => api.post(`/resources/${id}/view/`),
  getTopRated: () => api.get('/resources/top_rated/'),
  getMostDownloaded: () => api.get('/resources/most_downloaded/'),
};

// Comments API
export const commentsAPI = {
  getByResource: (resourceId) => api.get(`/resources/${resourceId}/comments/`),
  create: (resourceId, data) => api.post(`/resources/${resourceId}/comments/`, data),
  update: (resourceId, commentId, data) => 
    api.patch(`/resources/${resourceId}/comments/${commentId}/`, data),
  delete: (resourceId, commentId) => 
    api.delete(`/resources/${resourceId}/comments/${commentId}/`),
};

// Ratings API
export const ratingsAPI = {
  getByResource: (resourceId) => api.get('/ratings/', { params: { resource: resourceId } }),
  create: (data) => api.post('/ratings/', data),
  update: (id, data) => api.patch(`/ratings/${id}/`, data),
  delete: (id) => api.delete(`/ratings/${id}/`),
};

export default api;