import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import { useConnectivityStore } from '../utils/connectivity';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    useConnectivityStore.getState().setOnline(true);
    return response;
  },
  (error) => {
    if (!error.response) {
      useConnectivityStore.getState().setOnline(false);
    }
    return Promise.reject(error);
  },
);
