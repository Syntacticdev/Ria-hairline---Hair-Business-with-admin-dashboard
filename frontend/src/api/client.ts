import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? 'An unexpected error occurred.';
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
};