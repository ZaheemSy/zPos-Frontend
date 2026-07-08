import { create } from 'zustand';

export interface CartItem {
  productId: string;
  variantId: string | null;
  name: string;
  unit: string;
  unitPrice: number;
  taxPercent: number;
  cessPercent: number;
  quantity: number;
  discountAmount: number;
  stockAvailable: number;
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  customerLabel: string | null;
  isIgst: boolean;
  specialDiscount: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  updateDiscount: (productId: string, variantId: string | null, discountAmount: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  setCustomer: (id: string | null, label: string | null) => void;
  setIgst: (value: boolean) => void;
  setSpecialDiscount: (value: number) => void;
  clear: () => void;
}

function sameLine(a: { productId: string; variantId: string | null }, productId: string, variantId: string | null) {
  return a.productId === productId && a.variantId === variantId;
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],
  customerId: null,
  customerLabel: null,
  isIgst: false,
  specialDiscount: 0,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => sameLine(i, item.productId, item.variantId));
      if (existing) {
        return {
          items: state.items.map((i) =>
            sameLine(i, item.productId, item.variantId) ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  updateQuantity: (productId, variantId, quantity) =>
    set((state) => ({
      items: state.items.map((i) => (sameLine(i, productId, variantId) ? { ...i, quantity } : i)),
    })),

  updateDiscount: (productId, variantId, discountAmount) =>
    set((state) => ({
      items: state.items.map((i) => (sameLine(i, productId, variantId) ? { ...i, discountAmount } : i)),
    })),

  removeItem: (productId, variantId) =>
    set((state) => ({ items: state.items.filter((i) => !sameLine(i, productId, variantId)) })),

  setCustomer: (id, label) => set({ customerId: id, customerLabel: label }),
  setIgst: (value) => set({ isIgst: value }),
  setSpecialDiscount: (value) => set({ specialDiscount: value }),

  clear: () => set({ items: [], customerId: null, customerLabel: null, isIgst: false, specialDiscount: 0 }),
}));
