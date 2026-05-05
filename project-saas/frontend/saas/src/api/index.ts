// =============================================================
//  src/api/index.ts
//  Toutes les fonctions d'appel API regroupées par domaine
// =============================================================

import { api, apiGet, apiPost, apiPatch, apiPut, apiDelete } from "./client";

// ── Types partagés ─────────────────────────────────────────
export interface Product {
  id: string; name: string; price: number; stock: number; isActive: boolean;
  unit?: string;
  costPrice?: number; minStock?: number;
  imageUrl?: string; colorCode?: string;
  category: { id: string; name: string; type: "FOOD" | "DRINK" };
}
export interface Category { id: string; name: string; type: "FOOD" | "DRINK"; }

export interface Order {
  id: string; tableId: string; status: "PENDING"|"VALIDATED"|"REJECTED"|"PAID"|"ACCEPTED"|"READY";
  totalAmount: number; createdAt: string;
  table: { name: string };
  items: Array<{ id: string; quantity: number; price: number; product: { name: string } }>;
  payments?: any[];
}

export interface OrderItem {
  id:        string;
  quantity:  number;
  price:     number;
  product:   { name: string };
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

export interface TableSession {
  tableSessionToken: string;
  table:  { id: string; name: string; capacity: number };
  tenant: { name: string; businessType: string };
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
    apiPost<{ token: string; user: any; tenant: any }>("/auth/login", { email, password }),
  superAdminLogin: (email: string, password: string) =>
    apiPost<{ token: string; user: any; tenant: any }>("/auth/system-login", { email, password }),
  register: (data: any) =>
    apiPost<{ token: string; user: any; tenant: any }>("/auth/register", data),
  staffLogin: (identifier: string, pin: string) =>
    apiPost<{ token: string; staff: any; tenant: any }>("/auth/staff-login", { identifier, pin }),
  googleLogin: (data: { token: string; tenantName?: string; businessType?: string; phone?: string }) =>
    apiPost<{ token: string; user: any; tenant: any; needsRegistration?: boolean; email?: string; name?: string }>("/auth/google", data),
  me:       () => apiGet<{ user: any; tenant: any }>("/auth/me"),
};

// ── Table API ──────────────────────────────────────────────
export const TableApi = {
  scanQr: (qrToken: string) =>
    apiGet<TableSession>(`/tables/scan/${qrToken}`),
  list:   () => apiGet<TableData[]>("/tables"),
  create: (data: any) => apiPost<TableData>("/tables", data),
  update: (id: string, data: any) => apiPatch<TableData>(`/tables/${id}`, data),
  regenerateQr: (id: string) => apiPost<{ qrUrl: string; qrToken: string }>(`/tables/${id}/regenerate-qr`),
};

// ── Product API ────────────────────────────────────────────
export const ProductApi = {
  list:           (filters?: any) => apiGet<Product[]>("/products", filters),
  getCategories:  ()              => apiGet<Category[]>("/categories"),
  create:         (data: any)     => apiPost<Product>("/products", data),
  update:         (id: string, data: any) => apiPatch<Product>(`/products/${id}`, data),
  adjustStock:    (id: string, quantity: number) => apiPatch<Product>(`/products/${id}/stock`, { quantity }),
};

// ── Product Model API ──────────────────────────────────────
export const ProductModelApi = {
  getCategories: () => apiGet<ProductModelCategory[]>("/product-models/categories"),
  getByCategory: (catId: string) => apiGet<ProductModel[]>(`/product-models/category/${catId}`),
  importModel:   (data: { modelId: string; categoryId: string; price: number }) => 
    apiPost<Product>("/product-models/import", data),
};

// ── Category API ───────────────────────────────────────────
export const CategoryApi = {
  list:   ()              => apiGet<Category[]>("/categories"),
  create: (data: any)     => apiPost<Category>("/categories", data),
  update: (id: string, d: any) => apiPatch<Category>(`/categories/${id}`, d),
  delete: (id: string)    => apiDelete<void>(`/categories/${id}`),
};

// ── Order API ──────────────────────────────────────────────
export const OrderApi = {
  create:       (items: any[], tableId?: string) => apiPost<Order>("/orders", { items, tableId }),
  list:         (filters?: any)            => apiGet<Order[]>("/orders", filters),
  getById:      (id: string)               => apiGet<Order>(`/orders/${id}`),
  addItem:      (id: string, items: any[]) => apiPut<Order>(`/orders/${id}/items`, { items }),
  removeItem:   (id: string, itemId: string) => apiDelete<Order>(`/orders/${id}/items/${itemId}`),
  updateStatus: (id: string, status: string) => apiPatch<Order>(`/orders/${id}/status`, { status }),
  cancel:       (id: string)               => apiDelete<Order>(`/orders/${id}`),
};

// ── Staff API ──────────────────────────────────────────────
export const StaffApi = {
  list:     ()              => apiGet<Staff[]>("/staff"),
  create:   (data: any)     => apiPost<Staff>("/staff", data),
  update:   (id: string, data: any) => apiPut<Staff>(`/staff/${id}`, data),
  delete:   (id: string)    => apiDelete<void>(`/staff/${id}`),
  pinLogin: (tenantId: string, identifier: string, pin: string) =>
    apiPost<{ staffSessionToken: string; staff: any }>("/staff/pin-login", { tenantId, identifier, pin }),
};

// ── Role API ───────────────────────────────────────────────
export const RoleApi = {
  list:   ()              => apiGet<any[]>("/roles"),
  create: (data: any)     => apiPost<any>("/roles", data),
  update: (id: string, data: any) => apiPut<any>(`/roles/${id}`, data),
  delete: (id: string)    => apiDelete<any>(`/roles/${id}`),
};

// ── Cycle API ──────────────────────────────────────────────
export const CycleApi = {
  getActive: ()                                => apiGet<any>("/cycles/active"),
  open:      (openingCash?: number)            => apiPost<any>("/cycles", { openingCash }),
  close:     (id: string, closingCash: number, notes?: string) =>
    apiPost<any>(`/cycles/${id}/close`, { closingCash, notes }),
  getReport: (id: string)                      => apiGet<any>(`/cycles/${id}/report`),
  list:      ()                                => apiGet<any[]>("/cycles"),
};

// ── Payment API ────────────────────────────────────────────
export const PaymentApi = {
  pay:     (orderId: string, method: string, amount: number) =>
    apiPost<any>("/payments", { orderId, method, amount }),
  summary: (cycleId: string) => apiGet<any>(`/payments/summary/${cycleId}`),
};

// ── Expense API ────────────────────────────────────────────
export const ExpenseApi = {
  list:   (cycleId?: string) => apiGet<any[]>("/expenses", cycleId ? { cycleId } : undefined),
  create: (data: any)        => apiPost<any>("/expenses", data),
};

// ── Subscription API ───────────────────────────────────────
export const SubscriptionApi = {
  get:       () => apiGet<any>("/subscription"),
  changePlan: (plan: string) => apiPatch<any>("/subscription/plan", { plan }),
  // Super Admin
  listAll:   () => apiGet<any[]>("/subscription/all"),
  getStats:  () => apiGet<any>("/subscription/stats"),
  verify:    (tenantId: string) => apiPost<any>(`/subscription/verify/${tenantId}`),
  suspend:   (tenantId: string) => apiPost<any>(`/subscription/suspend/${tenantId}`),
  activate:  (id: string) => apiPost(`/subscription/activate/${id}`),
  reject:    (id: string) => apiPost(`/subscription/reject/${id}`),
  adminChangePlan: (id: string, plan: string) => apiPost(`/subscription/admin/change-plan/${id}`, { plan }),
  deleteTenant: (tenantId: string) => apiDelete<any>(`/subscription/tenant/${tenantId}`),
};

// ── Notification API ───────────────────────────────────────
export const NotificationApi = {
  list:       () => apiGet<any>("/notifications"),
  markRead:   (id: string) => apiPatch<any>(`/notifications/${id}/read`),
  markAllRead: () => apiPatch<any>("/notifications/read-all"),
  delete:      (id: string) => apiDelete<any>(`/notifications/${id}`),
};

// ── Upload API ─────────────────────────────────────────────
export const UploadApi = {
  uploadImage: async (file: any) => {
    // Dans React Native, file correspond souvent à un objet avec uri, type, name.
    const formData = new FormData();
    formData.append("image", file as any);
    const r = await api.post<{ success: boolean; data: { url: string; filename: string } }>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return r.data.data;
  }
};

// ── Statistic API ──────────────────────────────────────────
export const StatisticApi = {
  calculate: (startDate: string, endDate: string) => apiPost<any>("/statistics/calculate", { startDate, endDate }),
  list:      () => apiGet<any[]>("/statistics"),
};