import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
baseURL: `${import.meta.env.VITE_API_URL}/api`,
timeout: 60000,
 headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – attach token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 refresh flow
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh-token', { refreshToken });
          const { token } = res.data;
          useAuthStore.getState().setToken(token);
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        } catch {
          useAuthStore.getState().logout();
          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    const message = error.response?.data?.message || error.message || 'An error occurred.';
    if (error.response?.status !== 401) toast.error(message);

    return Promise.reject(error);
  }
);

export default api;

// ── API helpers ──
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: object) => api.post('/auth/register', data),
  verifyOTP: (data: { otp: string; tempToken: string }) => api.post('/auth/verify-otp', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.patch(`/auth/reset-password/${token}`, { password }),
  setupOTP: () => api.post('/auth/setup-otp'),
  disableOTP: () => api.post('/auth/disable-otp'),
};

export const productApi = {
  getAll: (params?: object) => api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: object) => api.post('/products', data),
  update: (id: string, data: object) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  adjustStock: (id: string, data: object) => api.patch(`/products/${id}/adjust-stock`, data),
  getLowStock: () => api.get('/products/low-stock'),
  getHistory: (id: string, params?: object) => api.get(`/products/${id}/history`, { params }),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data: object) => api.post('/categories', data),
  update: (id: string, data: object) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const supplierApi = {
  getAll: (params?: object) => api.get('/suppliers', { params }),
  getOne: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: object) => api.post('/suppliers', data),
  update: (id: string, data: object) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

export const transactionApi = {
  getAll: (params?: object) => api.get('/transactions', { params }),
};

export const reportApi = {
  exportInventoryPDF: () => api.get('/reports/inventory/pdf', { responseType: 'blob' }),
  exportInventoryExcel: () => api.get('/reports/inventory/excel', { responseType: 'blob' }),
  exportTransactionsPDF: (params?: object) => api.get('/reports/transactions/pdf', { responseType: 'blob', params }),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getTrend: (days?: number) => api.get('/dashboard/trend', { params: { days } }),
  getCategories: () => api.get('/dashboard/categories'),
  getTopProducts: (params?: object) => api.get('/dashboard/top-products', { params }),
};

export const aiApi = {
  getSummary: () => api.get('/ai/summary'),
  predictReorder: (id: string) => api.get(`/ai/reorder/${id}`),
  detectAnomalies: () => api.get('/ai/anomalies'),
  chat: (message: string, history: object[]) => api.post('/ai/chat', { message, history }),
};

export const userApi = {
  getAll: () => api.get('/users'),
  updateProfile: (data: object) => api.put('/users/me/profile', data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  toggleStatus: (id: string, isActive: boolean) => api.patch(`/users/${id}/status`, { isActive }),
};