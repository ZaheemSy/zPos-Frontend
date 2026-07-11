import { apiClient } from './client';

export type StockMode = 'per_branch' | 'shared';
export type TenantStatus = 'active' | 'suspended';

export interface TenantSummary {
  id: string;
  name: string;
  status: TenantStatus;
  stockMode: StockMode;
  maxBranches: number;
  branchCount: number;
  expiresAt: string | null;
  planNote: string | null;
  createdAt: string;
}

export interface TenantBranch {
  id: string;
  name: string;
  cashierLimit: number;
  cashierCount: number;
}

export interface TenantDetail {
  id: string;
  name: string;
  status: TenantStatus;
  stockMode: StockMode;
  maxBranches: number;
  expiresAt: string | null;
  planNote: string | null;
  createdAt: string;
  admin: { id: string; name: string; email: string } | null;
  branches: TenantBranch[];
}

export interface CreateTenantInput {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  maxBranches: number;
  stockMode: StockMode;
  expiresAt?: string;
  planNote?: string;
}

export interface UpdateTenantInput {
  maxBranches?: number;
  stockMode?: StockMode;
  status?: TenantStatus;
  expiresAt?: string | null;
  planNote?: string;
}

export interface AddBranchInput {
  name: string;
  cashierLimit: number;
}

export interface UpdateSuperAdminBranchInput {
  name?: string;
  cashierLimit?: number;
}

export function listTenants() {
  return apiClient.get<TenantSummary[]>('/super-admin/tenants').then((res) => res.data);
}

export function getTenant(id: string) {
  return apiClient.get<TenantDetail>(`/super-admin/tenants/${id}`).then((res) => res.data);
}

export function createTenant(input: CreateTenantInput) {
  return apiClient.post<TenantDetail>('/super-admin/tenants', input).then((res) => res.data);
}

export function updateTenant(id: string, input: UpdateTenantInput) {
  return apiClient.patch<TenantDetail>(`/super-admin/tenants/${id}`, input).then((res) => res.data);
}

export function addBranch(tenantId: string, input: AddBranchInput) {
  return apiClient.post(`/super-admin/tenants/${tenantId}/branches`, input).then((res) => res.data);
}

export function updateSuperAdminBranch(branchId: string, input: UpdateSuperAdminBranchInput) {
  return apiClient.patch(`/super-admin/branches/${branchId}`, input).then((res) => res.data);
}

export function resetAdminPassword(tenantId: string, newPassword: string) {
  return apiClient.post(`/super-admin/tenants/${tenantId}/reset-admin-password`, { newPassword }).then((res) => res.data);
}
