import { api } from './client';
import type { ApiResponse, AuthResponse, User, Product, Address, Review, MyReview, Order, Paginated } from '../types';

// ---------- Auth ----------
export const register = (payload: { firstName: string; lastName: string; email: string; password: string }) =>
  api.post<ApiResponse<AuthResponse>>('/auth/register', payload).then((r) => r.data.data!);

export const login = (payload: { email: string; password: string }) =>
  api.post<ApiResponse<AuthResponse>>('/auth/login', payload).then((r) => r.data.data!);

export const googleLogin = (idToken: string) =>
  api.post<ApiResponse<AuthResponse>>('/auth/google', { idToken }).then((r) => r.data.data!);

export const getMe = () => api.get<ApiResponse<{ user: User }>>('/auth/me').then((r) => r.data.data!.user);

export const logout = () => api.post('/auth/logout').then((r) => r.data);

export const changePassword = (payload: { currentPassword: string; newPassword: string }) =>
  api.post('/auth/change-password', payload).then((r) => r.data);

// ---------- Products ----------
export const getProducts = (params: Record<string, unknown> = {}) =>
  api.get<ApiResponse<{ products: Product[] } & Paginated>>('/products', { params }).then((r) => r.data.data!);

export const getFeaturedProducts = () =>
  api.get<ApiResponse<{ products: Product[] }>>('/products/featured').then((r) => r.data.data!);

export const getCategories = () =>
  api.get<ApiResponse<{ categories: string[] }>>('/products/categories').then((r) => r.data.data!);

export const getProduct = (id: string) =>
  api.get<ApiResponse<{ product: Product }>>(`/products/${id}`).then((r) => r.data.data!);

// ---------- Reviews ----------
export const getProductReviews = (productId: string) =>
  api.get<ApiResponse<{ reviews: Review[] }>>(`/reviews/product/${productId}`).then((r) => r.data.data!);

export const createReview = (productId: string, payload: { rating: number; title?: string; comment: string }) =>
  api.post<ApiResponse<{ review: Review }>>(`/reviews/product/${productId}`, payload).then((r) => r.data.data!);

export const getMyReviews = () =>
  api.get<ApiResponse<{ reviews: MyReview[] }>>('/reviews/my').then((r) => r.data.data!.reviews);

// ---------- Addresses ----------
export const getAddresses = () =>
  api.get<ApiResponse<{ addresses: Address[] }>>('/users/addresses').then((r) => r.data.data!);

export const createAddress = (payload: Partial<Address>) =>
  api.post<ApiResponse<{ address: Address }>>('/users/addresses', payload).then((r) => r.data.data!);

export const updateAddress = (id: string, payload: Partial<Address>) =>
  api.put<ApiResponse<{ address: Address }>>(`/users/addresses/${id}`, payload).then((r) => r.data.data!);

export const setDefaultAddress = (id: string) =>
  api.patch<ApiResponse<{ address: Address }>>(`/users/addresses/${id}/default`).then((r) => r.data.data!);

export const deleteAddress = (id: string) =>
  api.delete(`/users/addresses/${id}`).then((r) => r.data);

// ---------- User profile ----------
export const updateProfile = (payload: { firstName: string; lastName: string; phone?: string }) =>
  api.put<ApiResponse<{ user: User }>>('/users/profile', payload).then((r) => r.data.data!);

// ---------- Orders ----------
export const getMyOrders = (page = 1) =>
  api.get<ApiResponse<{ orders: Order[] } & Paginated>>('/orders/my', { params: { page } }).then((r) => r.data.data!);

export const getOrder = (id: string) =>
  api.get<ApiResponse<{ order: Order }>>(`/orders/my/${id}`).then((r) => r.data.data!);

export const cancelOrder = (id: string) =>
  api.patch(`/orders/my/${id}/cancel`).then((r) => r.data);

// ---------- Payments ----------
export const initializePayment = (payload: { items: { product: string; quantity: number; size?: string }[]; deliveryAddressId: string; callbackUrl?: string; notes?: string }) =>
  api
    .post<ApiResponse<{ authorizationUrl: string; reference: string; accessCode: string; transactionId: string }>>('/payments/initialize', payload)
    .then((r) => r.data.data!);