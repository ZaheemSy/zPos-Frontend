import { apiClient } from './client';

export interface Setting {
  key: string;
  value: string;
  branchId: string | null;
}

export function listSettings(branchId?: string) {
  return apiClient.get<Setting[]>('/settings', { params: branchId ? { branchId } : {} }).then((res) => res.data);
}

export function upsertSetting(key: string, value: string, branchId?: string) {
  return apiClient.put<Setting>(`/settings/${key}`, { value, branchId }).then((res) => res.data);
}
