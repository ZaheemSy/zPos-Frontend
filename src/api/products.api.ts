import { apiClient } from './client';

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  hsnCode: string;
  unit: string;
  taxPercent: string;
  cessPercent: string;
  hasVariants: boolean;
  hasBatchTracking: boolean;
  isActive: boolean;
  variants: ProductVariant[];
}

export interface CreateProductInput {
  name: string;
  description?: string;
  hsnCode: string;
  unit: string;
  taxPercent: number;
  cessPercent?: number;
  hasVariants?: boolean;
  hasBatchTracking?: boolean;
}

export function listProducts() {
  return apiClient.get<Product[]>('/products').then((res) => res.data);
}

export function createProduct(input: CreateProductInput) {
  return apiClient.post<Product>('/products', input).then((res) => res.data);
}

export function updateProduct(id: string, input: Partial<CreateProductInput>) {
  return apiClient.patch<Product>(`/products/${id}`, input).then((res) => res.data);
}

export function deleteProduct(id: string) {
  return apiClient.delete(`/products/${id}`).then((res) => res.data);
}

export function addVariant(productId: string, name: string, sku?: string) {
  return apiClient.post<ProductVariant>(`/products/${productId}/variants`, { name, sku }).then((res) => res.data);
}
