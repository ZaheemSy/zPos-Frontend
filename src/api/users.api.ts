import { apiClient } from './client';

export interface Cashier {
  id: string;
  name: string;
  email: string;
  branchId: string | null;
  branch: { id: string; name: string } | null;
  isActive: boolean;
}

export interface CreateCashierInput {
  name: string;
  email: string;
  password: string;
  branchId: string;
}

export interface UpdateCashierInput {
  name?: string;
  branchId?: string;
}

export function listCashiers() {
  return apiClient.get<Cashier[]>('/users/cashiers').then((res) => res.data);
}

export function createCashier(input: CreateCashierInput) {
  return apiClient.post<Cashier>('/users/cashiers', input).then((res) => res.data);
}

export function updateCashier(id: string, input: UpdateCashierInput) {
  return apiClient.patch<Cashier>(`/users/cashiers/${id}`, input).then((res) => res.data);
}

export function deleteCashier(id: string) {
  return apiClient.delete(`/users/cashiers/${id}`).then((res) => res.data);
}

export function resetCashierPassword(id: string, newPassword: string) {
  return apiClient.post(`/users/cashiers/${id}/reset-password`, { newPassword }).then((res) => res.data);
}
