// =============================================================
//  src/stores/pos.store.ts
//  État global du POS (Point of Sale) — côté staff
//
//  Contient :
//  - staffSessionToken : token PIN du caissier connecté
//  - activeCycleId     : le cycle de caisse ouvert aujourd'hui
//  - currentStaff      : infos de l'employé connecté
// =============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  setStaffSession: (token: string, staff: StaffInfo, tenantId: string) => void;
  setActiveCycle:  (cycleId: string | null) => void;
  logout:          () => void;
  isLoggedIn:      () => boolean;
  hasPermission:   (permission: string) => boolean;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      staffSessionToken: null,
      currentStaff:      null,
      activeCycleId:     null,
      tenantId:          null,

      // Appelé après un login PIN réussi
      setStaffSession: (token, staff, tenantId) =>
        set({ staffSessionToken: token, currentStaff: staff, tenantId }),

      setActiveCycle: (cycleId) =>
        set({ activeCycleId: cycleId }),

      logout: () =>
        set({ staffSessionToken: null, currentStaff: null, activeCycleId: null }),

      isLoggedIn: () => get().staffSessionToken !== null,

      // Vérifie si l'employé a la permission requise
      // Usage : if (hasPermission("PROCESS_PAYMENT")) { ... }
      hasPermission: (permission) =>
        get().currentStaff?.permissions.includes(permission) ?? false,
    }),
    {
      name:    "pos-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);