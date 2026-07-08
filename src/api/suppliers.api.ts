import { apiClient } from './client';

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gstin: string | null;
}

export interface CreateSupplierInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
}

export function listSuppliers() {
  return apiClient.get<Supplier[]>('/suppliers').then((res) => res.data);
}

export function createSupplier(input: CreateSupplierInput) {
  return apiClient.post<Supplier>('/suppliers', input).then((res) => res.data);
}
