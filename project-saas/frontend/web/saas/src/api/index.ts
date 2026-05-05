// src/api/index.ts

import axios from "axios";
import { useAuthStore, useTableStore, usePosStore } from "../stores";

const BASE_URL = "http://192.168.1.249:3000/api/v1";
export const API_HOST = BASE_URL.replace("/api/v1", "");

// ── Instance Axios ─────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Injecter le bon token automatiquement
api.interceptors.request.use((config) => {
  const tableStore = useTableStore.getState();
  const tableToken = tableStore.hasSession() ? tableStore.tableSessionToken : null;
  const staffToken = usePosStore.getState().staffSessionToken;
  const authToken  = useAuthStore.getState().token;

  // Si on est sur l'endpoint /staff (list), on préfère le token Admin 
  // car on n'est pas encore "PIN-logged"
  const isListingStaff = config.url === "/staff" && config.method === "get";
  
  const token = isListingStaff ? (authToken ?? staffToken) : (tableToken ?? staffToken ?? authToken);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Si c'est un token de table, on rafraîchit la session de 15min
    if (token === tableToken) {
      tableStore.refreshSession();
    }
  }
  return config;
});

// Gérer les 401 globalement
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      usePosStore.getState().logout();
      useTableStore.getState().clearSession();
    }
    return Promise.reject(error);
  }
);

// ── Helpers typés ──────────────────────────────────────────
async function get<T>(url: string, params?: object): Promise<T> {
  const r = await api.get<{ success: boolean; data: T }>(url, { params });
  return r.data.data;
}
async function post<T>(url: string, body?: object): Promise<T> {
  const r = await api.post<{ success: boolean; data: T }>(url, body);
  return r.data.data;
}
async function patch<T>(url: string, body?: object): Promise<T> {
  const r = await api.patch<{ success: boolean; data: T }>(url, body);
  return r.data.data;
}
async function put<T>(url: string, body?: object): Promise<T> {
  const r = await api.put<{ success: boolean; data: T }>(url, body);
  return r.data.data;
}
async function del<T>(url: string): Promise<T> {
  const r = await api.delete<{ success: boolean; data: T }>(url);
  return r.data.data;
}

// ── Types ──────────────────────────────────────────────────
export interface Product {
  id: string; name: string; price: number; stock: number; isActive: boolean;
  unit?: string;
  costPrice?: number; minStock?: number;
  imageUrl?: string; colorCode?: string;
  category: { id: string; name: string; type: "FOOD" | "DRINK" };
}
export interface Category { id: string; name: string; type: "FOOD" | "DRINK"; }
export interface Order {
  id: string; tableId: string; status: "PENDING"|"VALIDATED"|"REJECTED"|"PAID";
  totalAmount: number; createdAt: string;
  table: { name: string };
  items: Array<{ id: string; quantity: number; price: number; product: { name: string } }>;
  payments?: any[];
}

export interface Staff {
  id: string; name: string;
  identifier: string;
  role: { id: string; name: string; permissions: string[] };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category?: string;
  isRead: boolean;
  createdAt: string;
}
export interface TableData {
  id: string; name: string; capacity: number; isActive: boolean;
  qrToken: string; qrUrl: string;
  activeOrder?: { id: string; status: string; totalAmount: number } | null;
}
export interface ProductModelCategory {
  id: string;
  name: string;
  icon?: string;
  imageUrl?: string;
}
export interface ProductModel {
  id: string;
  categoryId: string;
  name: string;
  imageUrl?: string;
  unit: string;
}

// ── Auth API ───────────────────────────────────────────────
export const AuthApi = {
  login:    (email: string, password: string) =>
    post<{ token: string; user: any; tenant: any }>("/auth/login", { email, password }),
  superAdminLogin: (email: string, password: string) =>
    post<{ token: string; user: any; tenant: any }>("/auth/system-login", { email, password }),
  register: (data: any) =>
    post<{ token: string; user: any; tenant: any }>("/auth/register", data),
  staffLogin: (identifier: string, pin: string) =>
    post<{ token: string; staff: any; tenant: any }>("/auth/staff-login", { identifier, pin }),
  googleLogin: (data: { token: string; tenantName?: string; businessType?: string; phone?: string }) =>
    post<{ token: string; user: any; tenant: any; needsRegistration?: boolean; email?: string; name?: string }>("/auth/google", data),
  me:       () => get<any>("/auth/me"),
};

// ── Table API ──────────────────────────────────────────────
export const TableApi = {
  scanQr: (qrToken: string) =>
    get<{ token: string; tableSessionToken?: string; table: any; tenant: any }>(`/tables/scan/${qrToken}`),
  list:   () => get<TableData[]>("/tables"),
  create: (data: any) => post<TableData>("/tables", data),
  update: (id: string, data: any) => patch<TableData>(`/tables/${id}`, data),
  regenerateQr: (id: string) => post<{ qrUrl: string; qrToken: string }>(`/tables/${id}/regenerate-qr`),
};

// ── Product API ────────────────────────────────────────────
export const ProductApi = {
  list:           (filters?: any) => get<Product[]>("/products", filters),
  getCategories:  ()              => get<Category[]>("/categories"),
  create:         (data: any)     => post<Product>("/products", data),
  update:         (id: string, data: any) => patch<Product>(`/products/${id}`, data),
  adjustStock:    (id: string, quantity: number) => patch<Product>(`/products/${id}/stock`, { quantity }),
};

// ── Product Model API ──────────────────────────────────────
export const ProductModelApi = {
  getCategories: () => get<ProductModelCategory[]>("/product-models/categories"),
  getByCategory: (catId: string) => get<ProductModel[]>(`/product-models/category/${catId}`),
  importModel:   (data: { modelId: string; categoryId: string; price: number }) => 
    post<Product>("/product-models/import", data),
};

// ── Category API ───────────────────────────────────────────
export const CategoryApi = {
  list:   ()              => get<Category[]>("/categories"),
  create: (data: any)     => post<Category>("/categories", data),
  update: (id: string, d: any) => patch<Category>(`/categories/${id}`, d),
  delete: (id: string)    => del<void>(`/categories/${id}`),
};

// ── Order API ──────────────────────────────────────────────
export const OrderApi = {
  create:       (items: any[], tableId?: string) => post<Order>("/orders", { items, tableId }),
  list:         (filters?: any)            => get<Order[]>("/orders", filters),
  getById:      (id: string)               => get<Order>(`/orders/${id}`),
  addItem:      (id: string, items: any[]) => put<Order>(`/orders/${id}/items`, { items }),
  removeItem:   (id: string, itemId: string) => del<Order>(`/orders/${id}/items/${itemId}`),
  updateStatus: (id: string, status: string) => patch<Order>(`/orders/${id}/status`, { status }),
  cancel:       (id: string)               => del<Order>(`/orders/${id}`),
};

// ── Staff API ──────────────────────────────────────────────
export const StaffApi = {
  list:     ()              => get<Staff[]>("/staff"),
  create:   (data: any)     => post<Staff>("/staff", data),
  update:   (id: string, data: any) => put<Staff>(`/staff/${id}`, data),
  delete:   (id: string)    => del<void>(`/staff/${id}`),
  pinLogin: (tenantId: string, identifier: string, pin: string) =>
    post<{ staffSessionToken: string; staff: any }>("/staff/pin-login", { tenantId, identifier, pin }),
};

// ── Role API ───────────────────────────────────────────────
export const RoleApi = {
  list:   ()              => get<any[]>("/roles"),
  create: (data: any)     => post<any>("/roles", data),
  update: (id: string, data: any) => put<any>(`/roles/${id}`, data),
  delete: (id: string)    => del<any>(`/roles/${id}`),
};

// ── Cycle API ──────────────────────────────────────────────
export const CycleApi = {
  getActive: ()                                => get<any>("/cycles/active"),
  open:      (openingCash?: number)            => post<any>("/cycles", { openingCash }),
  close:     (id: string, closingCash: number, notes?: string) =>
    post<any>(`/cycles/${id}/close`, { closingCash, notes }),
  getReport: (id: string)                      => get<any>(`/cycles/${id}/report`),
  list:      ()                                => get<any[]>("/cycles"),
};

// ── Payment API ────────────────────────────────────────────
export const PaymentApi = {
  pay:     (orderId: string, method: string, amount: number) =>
    post<any>("/payments", { orderId, method, amount }),
  summary: (cycleId: string) => get<any>(`/payments/summary/${cycleId}`),
};

// ── Expense API ────────────────────────────────────────────
export const ExpenseApi = {
  list:   (cycleId?: string) => get<any[]>("/expenses", cycleId ? { cycleId } : undefined),
  create: (data: any)        => post<any>("/expenses", data),
};

// ── Subscription API ───────────────────────────────────────
export const SubscriptionApi = {
  get:       () => get<any>("/subscription"),
  changePlan: (plan: string) => patch<any>("/subscription/plan", { plan }),
  // Super Admin
  listAll:   () => get<any[]>("/subscription/all"),
  getStats:  () => get<any>("/subscription/stats"),
  verify:    (tenantId: string) => post<any>(`/subscription/verify/${tenantId}`),
  suspend:   (tenantId: string) => post<any>(`/subscription/suspend/${tenantId}`),
  activate:  (id: string) => post(`/subscription/activate/${id}`, {}),
  reject:    (id: string) => post(`/subscription/reject/${id}`, {}),
  adminChangePlan: (id: string, plan: string) => post(`/subscription/admin/change-plan/${id}`, { plan }),
  deleteTenant: (tenantId: string) => del<any>(`/subscription/tenant/${tenantId}`),
};

// ── Notification API ───────────────────────────────────────
export const NotificationApi = {
  list:       () => get<any>("/notifications"),
  markRead:   (id: string) => patch<any>(`/notifications/${id}/read`),
  markAllRead: () => patch<any>("/notifications/read-all"),
  delete:      (id: string) => del<any>(`/notifications/${id}`),
};

// ── Upload API ─────────────────────────────────────────────
export const UploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    // On utilise directement axios pour ne pas passer "application/json" dans le header
    const r = await api.post<{ success: boolean; data: { url: string; filename: string } }>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return r.data.data;
  }
};

// ── Statistic API ──────────────────────────────────────────
export const StatisticApi = {
  calculate: (startDate: string, endDate: string) => post<any>("/statistics/calculate", { startDate, endDate }),
  list:      () => get<any[]>("/statistics"),
};