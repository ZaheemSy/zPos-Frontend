import { apiClient } from './client';
import type { AuthUser } from '../store/auth.store';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function login(email: string, password: string) {
  return apiClient.post<LoginResponse>('/auth/login', { email, password }).then((res) => res.data);
}

export function logout() {
  return apiClient.post('/auth/logout');
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiClient.post('/auth/change-password', { currentPassword, newPassword });
}
