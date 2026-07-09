import { apiClient } from './client';

export interface ReportFilters {
  branchId?: string;
  from?: string;
  to?: string;
}

export interface SalesReport {
  totalRevenue: number;
  totalSales: number;
  byBranch: Array<{ branchId: string; branchName: string; revenue: number; count: number }>;
  byDay: Array<{ date: string; revenue: number; count: number }>;
}

export interface TaxReport {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
}

export interface ProfitReport {
  totalProfit: number;
  totalRevenue: number;
  marginPercent: number;
  byProduct: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
  }>;
}

export interface InventoryReport {
  stockValuation: number;
  lowStock: Array<{ productName: string; quantity: number; reorderPoint: number }>;
  bestSelling: Array<{ productName: string; quantitySold: number; stockOnHand: number }>;
  slowMoving: Array<{ productName: string; quantitySold: number; stockOnHand: number }>;
}

export interface CustomerCreditReport {
  totalOutstanding: number;
  customers: Array<{ id: string; name: string; phone: string | null; totalDue: number }>;
}

function toParams(filters: ReportFilters) {
  return {
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
  };
}

export function getSalesReport(filters: ReportFilters) {
  return apiClient.get<SalesReport>('/reports/sales', { params: toParams(filters) }).then((res) => res.data);
}

export function getTaxReport(filters: ReportFilters) {
  return apiClient.get<TaxReport>('/reports/tax', { params: toParams(filters) }).then((res) => res.data);
}

export function getProfitReport(filters: ReportFilters) {
  return apiClient.get<ProfitReport>('/reports/profit', { params: toParams(filters) }).then((res) => res.data);
}

export function getInventoryReport(filters: ReportFilters) {
  return apiClient.get<InventoryReport>('/reports/inventory', { params: toParams(filters) }).then((res) => res.data);
}

export function getCustomerCreditReport() {
  return apiClient.get<CustomerCreditReport>('/reports/customer-credit').then((res) => res.data);
}
