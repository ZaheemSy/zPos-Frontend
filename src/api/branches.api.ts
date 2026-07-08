import { apiClient } from './client';

export interface Branch {
  id: string;
  name: string;
}

export function listBranches() {
  return apiClient.get<Branch[]>('/branches').then((res) => res.data);
}
