import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.wazflo.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add interceptor to include token in requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Products
export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (key === 'image' && data[key]) {
            formData.append('image', data[key]);
        } else {
            formData.append(key, data[key]);
        }
    });
    return api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const importProducts = (productsData) => api.post('/products/import', { products: productsData });
export const updateProduct = (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (key === 'image' && data[key]) {
            formData.append('image', data[key]);
        } else {
            formData.append(key, data[key]);
        }
    });
    return api.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Variants
export const getVariants = (productId) => api.get(`/products/${productId}/variants`);
export const createVariant = (productId, data) => api.post(`/products/${productId}/variants`, data);
export const updateVariant = (productId, variantId, data) => api.put(`/products/${productId}/variants/${variantId}`, data);
export const deleteVariant = (productId, variantId) => api.delete(`/products/${productId}/variants/${variantId}`);

// Orders
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });
export const getOrderStats = () => api.get('/orders/stats');
export const getPlatformStats = () => api.get('/orders/platform-stats');

// Stores
export const getStores = () => api.get('/stores');
export const createStore = (data) => api.post('/stores', data);
export const updateStore = (id, data) => api.put(`/stores/${id}`, data);
export const deleteStore = (id) => api.delete(`/stores/${id}`);
export const getStoreSettings = () => api.get('/stores/settings');
export const updateStoreSettings = (data) => api.put('/stores/settings', data);

// Templates
export const getTemplates = () => api.get('/templates');
export const createTemplate = (data) => api.post('/templates', data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);

// Platform / Broadcasts
export const getMessages = () => api.get('/platform/messages');
export const getConversations = () => api.get('/platform/conversations');
export const getChatHistory = (phone) => api.get(`/platform/messages/${phone}`);
export const sendMessage = (phone, message) => api.post('/platform/messages/send', { phone, message });
export const getUsageLogs = () => api.get('/platform/usage');
export const getBroadcasts = () => api.get('/platform/broadcasts');
export const createBroadcast = (data) => api.post('/platform/broadcasts', data);
export const addStoreBalance = (id, amount) => api.post(`/platform/stores/${id}/balance`, { amount });

export default api;
