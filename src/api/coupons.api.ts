import { apiClient } from './client';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  minOrderValue: string;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number;
  validFrom: string;
  validUntil: string;
}

export function listCoupons() {
  return apiClient.get<Coupon[]>('/coupons').then((res) => res.data);
}

export function createCoupon(input: CreateCouponInput) {
  return apiClient.post<Coupon>('/coupons', input).then((res) => res.data);
}
