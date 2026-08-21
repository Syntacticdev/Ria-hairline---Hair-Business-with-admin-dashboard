import axios from 'axios';
import type { ApiResponse, AuthResponse, Product, Order, OrderStatus, User, Role, Review, Stats, PaymentTransaction, TransactionSummary } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rh_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rh_admin_token');
      localStorage.removeItem('rh_admin_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? 'An unexpected error occurred.';
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
};

// ---- auth ----
export const login = (payload: { email: string; password: string }) =>
  api.post<ApiResponse<AuthResponse>>('/auth/login', payload).then((r) => r.data.data!);

export const getMe = () => api.get<ApiResponse<{ user: AuthResponse['user'] }>>('/auth/me').then((r) => r.data.data!.user);

export const logout = () => api.post('/auth/logout').then((r) => r.data);

// ---- products ----
export const createProduct = (form: FormData) =>
  api.post<ApiResponse<{ product: Product }>>('/products', form).then((r) => r.data.data!);

export const updateProduct = (id: string, form: FormData) =>
  api.put<ApiResponse<{ product: Product }>>(`/products/${id}`, form).then((r) => r.data.data!);

export const getAllProducts = (params: Record<string, unknown> = {}) =>
  api
    .get<ApiResponse<{ products: Product[]; pagination: { page: number; total: number; pages: number } }>>('/products/admin/all', { params })
    .then((r) => r.data.data!);

export const deleteProduct = (id: string) => api.delete(`/products/${id}`).then((r) => r.data);
export const toggleProduct = (id: string, isActive: boolean) =>
  api.patch<ApiResponse<{ product: Product }>>(`/products/${id}/status`, { isActive }).then((r) => r.data.data!);

// ---- orders ----
export const getAllOrders = (params: Record<string, unknown> = {}) =>
  api
    .get<ApiResponse<{ orders: Order[]; pagination: { page: number; total: number; pages: number } }>>('/orders/admin/all', { params })
    .then((r) => r.data.data!);

export const updateOrderStatus = (id: string, orderStatus: OrderStatus) =>
  api.patch<ApiResponse<{ order: Order }>>(`/orders/admin/${id}/status`, { orderStatus }).then((r) => r.data.data!);

export const getOrder = (id: string) =>
  api.get<ApiResponse<{ order: Order }>>(`/orders/admin/${id}`).then((r) => r.data.data!.order);

// ---- users ----
export const getAllUsers = (params: Record<string, unknown> = {}) =>
  api
    .get<ApiResponse<{ users: User[]; pagination: { page: number; total: number; pages: number } }>>('/users/admin/all', { params })
    .then((r) => r.data.data!);

export const updateUser = (id: string, payload: { role?: Role; isActive?: boolean }) =>
  api.patch<ApiResponse<{ user: User }>>(`/users/admin/${id}`, payload).then((r) => r.data.data!);

// ---- reviews ----
export const getAllReviews = (params: Record<string, unknown> = {}) =>
  api
    .get<ApiResponse<{ reviews: Review[]; pagination: { page: number; total: number; pages: number } }>>('/reviews/admin/all', { params })
    .then((r) => r.data.data!);

export const approveReview = (id: string) => api.patch(`/reviews/${id}/approve`).then((r) => r.data);
export const rejectReview = (id: string) => api.patch(`/reviews/${id}/reject`).then((r) => r.data);

// ---- transactions ----
export const getTransactions = (params: Record<string, unknown> = {}) =>
  api
    .get<ApiResponse<{
      transactions: PaymentTransaction[];
      summary: TransactionSummary;
      pagination: { page: number; total: number; pages: number };
    }>>('/payments/admin/all', { params })
    .then((r) => r.data.data!);

// ---- stats ----
export const getStats = () =>
  api
    .get<ApiResponse<{ stats: Omit<Stats, 'recentOrders'>; recentOrders: Order[] }>>('/users/admin/stats/dashboard')
    .then((r) => r.data.data!);