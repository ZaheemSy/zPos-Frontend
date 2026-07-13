import { apiClient } from './client';

export interface SaleItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  discountAmount?: number;
}

export interface PaymentInput {
  paymentMode: 'cash' | 'card' | 'upi';
  amount: number;
}

export interface CreateSaleInput {
  customerId?: string;
  isIgst?: boolean;
  specialDiscount?: number;
  hold?: boolean;
  items: SaleItemInput[];
  payments?: PaymentInput[];
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  status: 'completed' | 'returned' | 'partially_returned' | 'held' | 'cancelled';
  isIgst: boolean;
  taxableAmount: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  cessAmount: string;
  subtotal: string;
  specialDiscount: string;
  total: string;
  amountReceived: string;
  balance: string;
  paymentTerms: string | null;
  dueDate: string | null;
  shippingName: string | null;
  shippingAddress: string | null;
  createdAt: string;
  customer: { name: string; phone: string | null; billingAddress: string | null; gstin: string | null } | null;
  items: Array<{
    id: string;
    itemDescription: string;
    hsnCode: string;
    unit: string;
    quantity: string;
    unitPrice: string;
    taxPercent: string;
    discountAmount: string;
    taxableValue: string;
    cgstAmount: string;
    sgstAmount: string;
    igstAmount: string;
    cessAmount: string;
    total: string;
  }>;
  payments: Array<{ paymentMode: string; amount: string }>;
  branch: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    gstin: string | null;
    bankName: string | null;
    bankBranch: string | null;
  };
  tenant: { name: string; logoUrl: string | null };
}

export function createSale(input: CreateSaleInput) {
  return apiClient.post<Sale>('/sales', input).then((res) => res.data);
}

export function getSale(id: string) {
  return apiClient.get<Sale>(`/sales/${id}`).then((res) => res.data);
}

export function listHeldSales() {
  return apiClient.get<Sale[]>('/sales', { params: { status: 'held' } }).then((res) => res.data);
}

export function resumeSale(id: string, payments: PaymentInput[]) {
  return apiClient.post<Sale>(`/sales/${id}/resume`, { payments }).then((res) => res.data);
}

export function findSalesByInvoiceNumber(invoiceNumber: string) {
  return apiClient.get<Sale[]>('/sales', { params: { invoiceNumber } }).then((res) => res.data);
}

export interface ReturnItemInput {
  saleItemId: string;
  quantityReturned: number;
}

export interface ProcessReturnInput {
  reason?: string;
  refundMode: 'cash' | 'upi' | 'credit_to_account';
  items: ReturnItemInput[];
}

export function processReturn(saleId: string, input: ProcessReturnInput) {
  return apiClient.post(`/sales/${saleId}/return`, input).then((res) => res.data);
}
