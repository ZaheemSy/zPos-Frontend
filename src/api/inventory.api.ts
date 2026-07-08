import { apiClient } from './client';

export interface InventoryRow {
  id: string;
  branchId: string;
  productId: string;
  variantId: string | null;
  quantity: string;
  reorderPoint: string;
  costPrice: string;
  sellingPrice: string;
  product: { name: string; hsnCode: string; unit: string };
  variant: { name: string } | null;
}

export interface UpsertInventoryInput {
  branchId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  reorderPoint?: number;
  costPrice: number;
  sellingPrice: number;
}

export function listInventory(branchId?: string) {
  return apiClient.get<InventoryRow[]>('/inventory', { params: branchId ? { branchId } : {} }).then((res) => res.data);
}

export function upsertInventory(input: UpsertInventoryInput) {
  return apiClient.post<InventoryRow>('/inventory', input).then((res) => res.data);
}

export function adjustInventory(id: string, input: Partial<UpsertInventoryInput>) {
  return apiClient.patch<InventoryRow>(`/inventory/${id}`, input).then((res) => res.data);
}
