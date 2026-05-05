// =============================================================
//  src/stores/table.store.ts
//  Session table après scan QR (côté client) et Panier du client
// =============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface TableInfo  { id: string; name: string; capacity: number; }
interface TenantInfo { name: string; businessType: string; }

interface TableState {
  tableSessionToken: string | null;
  table:             TableInfo  | null;
  tenant:            TenantInfo | null;
  expiresAt:         number | null;
  setTableSession:   (token: string, table: TableInfo, tenant: TenantInfo) => void;
  clearSession:      () => void;
  hasSession:        () => boolean;
  refreshSession:    () => void;
}

export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      tableSessionToken: null,
      table:             null,
      tenant:            null,
      expiresAt:         null,
      setTableSession: (token, table, tenant) => {
        const fifteenMinutes = 15 * 60 * 1000;
        set({ 
          tableSessionToken: token, 
          table, 
          tenant, 
          expiresAt: Date.now() + fifteenMinutes 
        });
      },
      clearSession: () => set({ tableSessionToken: null, table: null, tenant: null, expiresAt: null }),
      hasSession: () => {
        const { tableSessionToken, expiresAt } = get();
        if (!tableSessionToken || !expiresAt) return false;
        const isValid = Date.now() < expiresAt;
        if (!isValid) {
          // Auto-clear if expired
          setTimeout(() => set({ tableSessionToken: null, table: null, tenant: null, expiresAt: null }), 0);
          return false;
        }
        return true;
      },
      refreshSession: () => {
        const { tableSessionToken } = get();
        if (tableSessionToken) {
          set({ expiresAt: Date.now() + 15 * 60 * 1000 });
        }
      }
    }),
    { 
      name: "table-storage",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);

// ============================================================
// CART STORE — panier client
// ============================================================
interface CartItem {
  productId: string;
  name:      string;
  price:     number;
  quantity:  number;
  imageUrl?: string;
}

interface CartState {
  items:       CartItem[];
  addItem:     (product: { id: string; name: string; price: number; imageUrl?: string }) => void;
  removeItem:  (productId: string) => void;
  increaseQty: (productId: string) => void;
  decreaseQty: (productId: string) => void;
  clearCart:   () => void;
  totalItems:  () => number;
  totalAmount: () => number;
  itemCount:   (productId: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items    = get().items;
        const existing = items.find((i) => i.productId === product.id);
        if (existing) {
          set({ items: items.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...items, { productId: product.id, name: product.name, price: product.price, quantity: 1, imageUrl: product.imageUrl }] });
        }
      },
      removeItem:  (pid) => set({ items: get().items.filter((i) => i.productId !== pid) }),
      increaseQty: (pid) => set({ items: get().items.map((i) => i.productId === pid ? { ...i, quantity: i.quantity + 1 } : i) }),
      decreaseQty: (pid) => {
        const item = get().items.find((i) => i.productId === pid);
        if (!item) return;
        if (item.quantity === 1) set({ items: get().items.filter((i) => i.productId !== pid) });
        else set({ items: get().items.map((i) => i.productId === pid ? { ...i, quantity: i.quantity - 1 } : i) });
      },
      clearCart:   () => set({ items: [] }),
      totalItems:  () => get().items.reduce((s, i) => s + i.quantity, 0),
      totalAmount: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      itemCount:   (pid) => get().items.find((i) => i.productId === pid)?.quantity ?? 0,
    }),
    { 
      name: "cart-storage",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);