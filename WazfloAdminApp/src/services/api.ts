import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://193.203.160.3:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        const storeId = await SecureStore.getItemAsync('activeStoreId');
        if (storeId) {
            config.headers['X-Store-Id'] = storeId;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const login = (credentials: any) => api.post('/auth/login', credentials);
export const getOrders = () => api.get('/orders');
export const getStats = () => api.get('/orders/stats');
export const getRevenueReport = (days: number = 7) => api.get(`/orders/revenue-report?days=${days}`);
export const getStores = () => api.get('/stores');
export const updateOrderStatus = (id: number, status: string) => api.put(`/orders/${id}/status`, { status });
export const getProducts = () => api.get('/products');
export const createProduct = (data: FormData) => api.post('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

export const getSettings = () => api.get('/stores/settings');
export const updateSettings = (data: any) => api.put('/stores/settings', data);

export const updatePushToken = (token: string) => api.post('/auth/update-push-token', { token });

export default api;
