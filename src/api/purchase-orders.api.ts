import { apiClient } from './client';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantityOrdered: string;
  quantityReceived: string;
  costPrice: string;
  product: { name: string };
  variant: { name: string } | null;
}

export interface PurchaseOrder {
  id: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  orderedAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  supplier: { name: string };
  branch: { name: string };
  items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderItemInput {
  productId: string;
  variantId?: string;
  quantityOrdered: number;
  costPrice: number;
}

export interface CreatePurchaseOrderInput {
  branchId: string;
  supplierId: string;
  notes?: string;
  items: CreatePurchaseOrderItemInput[];
}

export function listPurchaseOrders() {
  return apiClient.get<PurchaseOrder[]>('/purchase-orders').then((res) => res.data);
}

export function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  return apiClient.post<PurchaseOrder>('/purchase-orders', input).then((res) => res.data);
}

export function receivePurchaseOrder(id: string) {
  return apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/receive`, {}).then((res) => res.data);
}
