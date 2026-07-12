import { apiClient } from './client';
import type { ImportPreviewResult } from './import.types';

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

export interface ProductImportRow {
  name: string;
  hsnCode: string;
  unit: string;
  taxPercent: number | string;
  cessPercent: number;
  description: string;
  [key: string]: string | number;
}

export function downloadProductImportTemplate() {
  return apiClient.get('/products/import-template', { responseType: 'blob' }).then((res) => res.data as Blob);
}

export function validateProductImport(file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiClient
    .post<ImportPreviewResult<ProductImportRow>>('/products/import/validate', form)
    .then((res) => res.data);
}

export function commitProductImport(rows: CreateProductInput[]) {
  return apiClient.post<{ created: number }>('/products/import/commit', { rows }).then((res) => res.data);
}
