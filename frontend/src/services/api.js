import axios from 'axios';

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
      return process.env.REACT_APP_API_URL.replace('localhost', '127.0.0.1');
    }
    return process.env.REACT_APP_API_URL;
  }
  const host = typeof window !== 'undefined' && window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
  return `http://${host}:8000/api`;
};

const API_BASE_URL = getApiBaseUrl();

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
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  verifyOTP: (data) => api.post('/auth/verify-otp/', data),
  resendOTP: (data) => api.post('/auth/resend-otp/', data),
  googleLogin: (payload) => api.post('/auth/google/', payload),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
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
    if (data && data.file) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return api.post('/resources/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/resources/', data);
  },
  update: (id, data) => api.patch(`/resources/${id}/`, data),
  delete: (id) => api.delete(`/resources/${id}/`),
  download: (id) => api.post(`/resources/${id}/download/`),
  view: (id) => api.post(`/resources/${id}/view/`),
  getTopRated: () => api.get('/resources/top_rated/'),
  getMostDownloaded: () => api.get('/resources/most_downloaded/'),
  getStats: () => api.get('/resources/stats/'),
  getFilterOptions: () => api.get('/resources/filter_options/'),
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
  getMyRatings: () => api.get('/ratings/'),
  getByResource: (resourceId) => api.get('/ratings/', { params: { resource: resourceId } }),
  create: (data) => api.post('/ratings/', data),
  update: (id, data) => api.patch(`/ratings/${id}/`, data),
  delete: (id) => api.delete(`/ratings/${id}/`),
};

// Downloads API (Student Download History)
export const downloadsAPI = {
  getHistory: (params) => api.get('/downloads/', { params }),
  clearHistory: () => api.delete('/downloads/clear_history/'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications/', { params }),
  markAsRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
};

// Contact API
export const contactAPI = {
  send: (data) => api.post('/contact/', data),
};

export default api;
