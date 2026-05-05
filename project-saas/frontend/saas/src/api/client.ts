// =============================================================
//  src/api/client.ts
//  Instance Axios partagée dans toute l'app
//
//  COMMENT ÇA MARCHE :
//  Avant chaque requête, un "intercepteur" regarde quel token
//  est disponible dans les stores Zustand et l'injecte dans
//  le header Authorization automatiquement.
//
//  Priorité des tokens :
//  1. tableSessionToken  (client QR — le plus spécifique)
//  2. staffSessionToken  (employé POS)
//  3. authToken          (admin/manager)
//
//  Comme ça, dans chaque hook ou service, tu fais juste :
//    api.get("/products")
//  Et le bon token est mis automatiquement. Pas besoin
//  de passer le token manuellement partout.
// =============================================================

import axios, { AxiosError } from "axios";
import { useAuthStore }  from "../store/auth.store";
import { useTableStore } from "../store/table.store";
import { usePosStore }   from "../store/pos.store";

// L'URL de ton backend — à mettre dans un fichier .env
// En développement : ton IP locale (pas localhost sur mobile !)
// Ex : http://192.168.1.42:3000/api/v1
const BASE_URL = "http://192.168.1.145:3000/api/v1";

// Création de l'instance Axios
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 secondes max par requête
  headers: {
    "Content-Type": "application/json",
    Accept:         "application/json",
  },
});

// ── Intercepteur de requête ────────────────────────────────
// Exécuté AVANT chaque requête — injecte le bon token
api.interceptors.request.use((config) => {
  // Lire les tokens depuis les stores Zustand
  const tableToken = useTableStore.getState().tableSessionToken;
  const staffToken = usePosStore.getState().staffSessionToken;
  const authToken  = useAuthStore.getState().token;

  // Choisir le bon token selon le contexte
  const token = tableToken ?? staffToken ?? authToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Intercepteur de réponse ────────────────────────────────
// Exécuté APRÈS chaque réponse — gère les erreurs globalement
api.interceptors.response.use(
  (response) => response, // Succès → on passe tel quel

  async (error: AxiosError<{ message: string; upgradeRequired?: boolean }>) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message;

    // Token expiré → déconnecter automatiquement
    if (status === 401) {
      const { token, staffSessionToken } = {
        token:            useAuthStore.getState().token,
        staffSessionToken: usePosStore.getState().staffSessionToken,
      };

      // Déconnecter selon quel token a expiré
      if (token)            useAuthStore.getState().logout();
      if (staffSessionToken) usePosStore.getState().logout();

      useTableStore.getState().clearSession();
    }

    // Abonnement insuffisant → on laisse les écrans gérer l'upgrade
    if (status === 403 && error.response?.data?.upgradeRequired) {
      console.warn("[API] Plan insuffisant :", message);
    }

    return Promise.reject(error);
  }
);

// ── Helpers typés ──────────────────────────────────────────
// Fonctions utilitaires pour des appels plus propres

export async function apiGet<T>(url: string, params?: object): Promise<T> {
  const response = await api.get<{ success: boolean; data: T }>(url, { params });
  return response.data.data;
}

export async function apiPost<T>(url: string, body?: object): Promise<T> {
  const response = await api.post<{ success: boolean; data: T }>(url, body);
  return response.data.data;
}

export async function apiPatch<T>(url: string, body?: object): Promise<T> {
  const response = await api.patch<{ success: boolean; data: T }>(url, body);
  return response.data.data;
}

export async function apiPut<T>(url: string, body?: object): Promise<T> {
  const response = await api.put<{ success: boolean; data: T }>(url, body);
  return response.data.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await api.delete<{ success: boolean; data: T }>(url);
  return response.data.data;
}