// src/stores/index.ts — Tous les stores en un fichier

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================
// AUTH STORE — admin/manager
// ============================================================
interface User   { id: string; email: string; role: "SUPERADMIN" | "ADMIN" | "MANAGER"; }
interface Tenant { 
  id: string; 
  name: string; 
  businessType: string; 
  subscription?: { status: "ACTIVE" | "PENDING" | "SUSPENDED" | "EXPIRED" };
}

interface AuthState {
  token:      string | null;
  user:       User   | null;
  tenant:     Tenant | null;
  setAuth:    (token: string, user: User, tenant: Tenant) => void;
  logout:     () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token:  null,
      user:   null,
      tenant: null,
      setAuth:    (token, user, tenant) => set({ token, user, tenant }),
      logout:     () => set({ token: null, user: null, tenant: null }),
      isLoggedIn: () => get().token !== null,
    }),
    { name: "auth-storage" }  // localStorage key
  )
);

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
    { name: "table-storage" }
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
    { name: "cart-storage" }
  )
);

// ============================================================
// POS STORE — session staff PIN
// ============================================================
interface StaffInfo {
  id:          string;
  name:        string;
  role:        { id: string; name: string; permissions: string[] };
  permissions: string[];
}

interface PosState {
  staffSessionToken: string | null;
  currentStaff:      StaffInfo | null;
  activeCycleId:     string | null;
  tenantId:          string | null;
  setStaffSession:   (token: string, staff: StaffInfo, tenantId: string) => void;
  setActiveCycle:    (cycleId: string | null) => void;
  logout:            () => void;
  isLoggedIn:        () => boolean;
  hasPermission:     (permission: string) => boolean;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      staffSessionToken: null,
      currentStaff:      null,
      activeCycleId:     null,
      tenantId:          null,
      setStaffSession: (token, staff, tenantId) => set({ staffSessionToken: token, currentStaff: staff, tenantId }),
      setActiveCycle:  (cycleId) => set({ activeCycleId: cycleId }),
      logout:          () => set({ staffSessionToken: null, currentStaff: null, activeCycleId: null }),
      isLoggedIn:      () => get().staffSessionToken !== null,
      hasPermission:   (p) => get().currentStaff?.permissions.includes(p) ?? false,
    }),
    { name: "pos-storage" }
  )
);