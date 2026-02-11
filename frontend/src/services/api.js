import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  updatePassword: (data) => api.put('/auth/update-password', data)
};

// Task APIs
export const taskAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  updateTaskStatus: (id, data) => api.put(`/tasks/${id}/status`, data),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  recalculatePriority: (id) => api.put(`/tasks/${id}/priority`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  updateTaskOrder: (tasks) => api.put('/tasks/bulk/update-order', { tasks })
};

// Analytics APIs
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getProductivity: (period) => api.get('/analytics/productivity', { params: { period } }),
  getPriorityDistribution: () => api.get('/analytics/priority-distribution'),
  getCompletionRate: (period) => api.get('/analytics/completion-rate', { params: { period } })
};

// Notification APIs
export const notificationAPI = {
  getUpcomingDeadlines: () => api.get('/notifications'),
  sendReminder: (taskId) => api.post(`/notifications/send-reminder/${taskId}`)
};

export default api;
