import { apiClient } from './client';

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  stateCode?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
}

export interface UpdateBranchInput {
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  stateCode?: string;
  bankName?: string;
  bankBranch?: string;
}

export function listBranches() {
  return apiClient.get<Branch[]>('/branches').then((res) => res.data);
}

export function updateBranch(id: string, input: UpdateBranchInput) {
  return apiClient.patch<Branch>(`/branches/${id}`, input).then((res) => res.data);
}
