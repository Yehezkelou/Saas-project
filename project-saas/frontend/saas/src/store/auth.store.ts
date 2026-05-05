// =============================================================
//  src/stores/auth.store.ts
//  État global de l'authentification admin/manager
//
//  ZUSTAND EN 3 MOTS :
//  C'est un "tiroir" global. N'importe quel composant peut
//  ouvrir ce tiroir pour lire ou modifier l'état.
//  Pas besoin de prop drilling ou de Context API complexe.
//
//  PERSISTANCE :
//  Le token est sauvegardé dans AsyncStorage.
//  Si l'utilisateur ferme et rouvre l'app → toujours connecté.
// =============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id:    string;
  email: string;
  role:  "SUPERADMIN" | "ADMIN" | "MANAGER";
}

interface Tenant {
  id:           string;
  name:         string;
  businessType: string;
  subscription?: { status: "ACTIVE" | "PENDING" | "SUSPENDED" | "EXPIRED" };
}

interface AuthState {
  // Données stockées
  token:  string | null;
  user:   User   | null;
  tenant: Tenant | null;

  // Actions
  setAuth:  (token: string, user: User, tenant: Tenant) => void;
  logout:   () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token:  null,
      user:   null,
      tenant: null,

      // Appelé après un login ou register réussi
      setAuth: (token, user, tenant) => set({ token, user, tenant }),

      // Vide tout → l'app redirige vers le login
      logout: () => set({ token: null, user: null, tenant: null }),

      // Vérification rapide dans les navigateurs
      isLoggedIn: () => get().token !== null,
    }),
    {
      name:    "auth-storage",            // Clé dans AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);