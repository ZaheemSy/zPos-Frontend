import { apiClient } from './client';
import type { ImportPreviewResult } from './import.types';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  billingAddress: string | null;
  gstin: string | null;
  loyaltyPoints: number;
  totalDue: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  billingAddress?: string;
  gstin?: string;
}

export interface CustomerHistory {
  sales: Array<{ id: string; invoiceNumber: string; total: string; createdAt: string }>;
  loyaltyTransactions: Array<{ id: string; pointsEarned: number; pointsRedeemed: number; balanceAfter: number }>;
}

export function listCustomers(search?: string) {
  return apiClient.get<Customer[]>('/customers', { params: search ? { search } : {} }).then((res) => res.data);
}

export function createCustomer(input: CreateCustomerInput) {
  return apiClient.post<Customer>('/customers', input).then((res) => res.data);
}

export function updateCustomer(id: string, input: Partial<CreateCustomerInput>) {
  return apiClient.patch<Customer>(`/customers/${id}`, input).then((res) => res.data);
}

export function deleteCustomer(id: string) {
  return apiClient.delete(`/customers/${id}`).then((res) => res.data);
}

export function getCustomerHistory(id: string) {
  return apiClient.get<CustomerHistory>(`/customers/${id}/history`).then((res) => res.data);
}

export interface CustomerImportRow {
  name: string;
  phone: string;
  email: string;
  billingAddress: string;
  gstin: string;
  [key: string]: string | number;
}

export function downloadCustomerImportTemplate() {
  return apiClient.get('/customers/import-template', { responseType: 'blob' }).then((res) => res.data as Blob);
}

export function validateCustomerImport(file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiClient
    .post<ImportPreviewResult<CustomerImportRow>>('/customers/import/validate', form)
    .then((res) => res.data);
}

export function commitCustomerImport(rows: CreateCustomerInput[]) {
  return apiClient.post<{ created: number }>('/customers/import/commit', { rows }).then((res) => res.data);
}
