// =============================================================
//  src/navigation/index.tsx — Navigation COMPLÈTE (Parties 1-4)
//
//  RootNavigator décide quel stack montrer selon les stores :
//  - Pas de token → AuthStack (login admin)
//  - authToken → AdminStack (dashboard)
//  - staffSessionToken → PosStack (caisse)
//  - tableSessionToken → ClientStack (menu client QR)
//
//  Le _layout de chaque stack vérifie le token dès l'entrée.
// =============================================================

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore }  from "../store/auth.store";
import { usePosStore }   from "../store/pos.store";
import { colors } from "../theme";

// ── Partie 3 — POS Staff ──────────────────────────────────
import { PinLoginScreen }  from "../screens/pos/PinLoginScreen";
import { TablesScreen }    from "../screens/pos/TablesScreen";
import { OrderScreen }     from "../screens/pos/OrderScreen";
import { PaymentScreen }   from "../screens/pos/PayementScreen";
import { KitchenScreen } from "../screens/pos/KitchenScreen";
import { CycleScreen } from "../screens/pos/CycleScreen";
import { OrderManagementScreen } from "../screens/pos/OrderManagementScreen";

// ── Partie 4 — Admin ──────────────────────────────────────
import { LoginScreen }      from "../screens/admin/LoginScreen";
import { RegisterScreen }   from "../screens/admin/RegisterScreen";
import { DashboardScreen }                  from "../screens/admin/DashboardScreen";
import { MenuManagerScreen }                from "../screens/admin/MenuManagerScreen";
import { TablesManagerScreen }              from "../screens/admin/TablesManagerScreen";
import { StaffScreen } from "../screens/admin/StaffScreen";
import { ReportsScreen } from "../screens/admin/ReportsScreen";
import { SubscriptionScreen } from "../screens/admin/SubscriptionScreen";
import { NotificationsScreen } from "../screens/admin/NotificationsScreen";

// ── Types de navigation ────────────────────────────────────
export type PosStackParams = {
  PinLogin:        undefined;
  Tables:          undefined;
  Order:           { tableId: string; tableName: string; orderId?: string };
  Payment:         { orderId: string; tableId: string; tableName: string; totalAmount: number };
  Kitchen:         undefined;
  Cycle:           undefined;
  OrderManagement: undefined;
};

export type AdminStackParams = {
  Login:         undefined;
  Register:      { googleData?: any; token?: string } | undefined;
  Dashboard:     undefined;
  MenuManager:   undefined;
  TablesManager: undefined;
  Staff:         undefined;
  Reports:       undefined;
  Subscription:  undefined;
  Notifications: undefined;
};

import { 
  createDrawerNavigator, 
  DrawerContentScrollView, 
  DrawerItem,
  DrawerContentComponentProps
} from "@react-navigation/drawer";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// ── Stacks ─────────────────────────────────────────────────
const PosStack    = createNativeStackNavigator<PosStackParams>();
const AdminStack  = createNativeStackNavigator<AdminStackParams>();
const AdminDrawer = createDrawerNavigator<AdminStackParams>();

const NAV_OPTIONS = {
  headerShown:  false,
  animation:    "slide_from_right" as const,
  contentStyle: { backgroundColor: colors.background },
};

function PosNavigator() {
  return (
    <PosStack.Navigator screenOptions={NAV_OPTIONS}>
      <PosStack.Screen name="PinLogin" component={PinLoginScreen} />
      <PosStack.Screen name="Tables"   component={TablesScreen} />
      <PosStack.Screen name="Order"    component={OrderScreen} />
      <PosStack.Screen name="Payment"  component={PaymentScreen} />
      <PosStack.Screen name="Kitchen"  component={KitchenScreen} />
      <PosStack.Screen name="Cycle"    component={CycleScreen} />
      <PosStack.Screen name="OrderManagement" component={OrderManagementScreen} />
    </PosStack.Navigator>
  );
}

const DRAWER_OPTIONS = {
  headerShown: false,
  drawerType: "front" as const,
  drawerStyle: {
    backgroundColor: "#0c0c0c",
    width: 280,
  },
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { tenant, logout } = useAuthStore();
  
  const menuItems = [
    { label: "Tableau de bord", icon: "dashboard", route: "Dashboard" },
    { label: "Menu & Produits", icon: "restaurant-menu", route: "MenuManager" },
    { label: "Tables & QR Codes", icon: "grid-view", route: "TablesManager" },
    { label: "Gestion Équipe", icon: "people", route: "Staff" },
    { label: "Rapports & Ventes", icon: "receipt-long", route: "Reports" },
    { label: "Mon Abonnement", icon: "credit-card", route: "Subscription" },
    { label: "Notifications", icon: "notifications", route: "Notifications" },
  ];

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, backgroundColor: "#0c0c0c" }}>
      <View style={drawerStyles.header}>
        <View style={drawerStyles.logoBox}>
          <Text style={drawerStyles.logoText}>{tenant?.name?.charAt(0) ?? "A"}</Text>
        </View>
        <View>
          <Text style={drawerStyles.tenantName} numberOfLines={1}>{tenant?.name ?? "Mon Établissement"}</Text>
          <Text style={drawerStyles.tenantSub}>{tenant?.businessType ?? "SaaS Admin"}</Text>
        </View>
      </View>

      <View style={drawerStyles.menuSection}>
        {menuItems.map((item) => {
          const isActive = props.state.routes[props.state.index].name === item.route;
          return (
            <TouchableOpacity 
              key={item.route}
              style={[drawerStyles.menuItem, isActive && drawerStyles.menuItemActive]}
              onPress={() => props.navigation.navigate(item.route)}
            >
              <MaterialIcons 
                name={item.icon} 
                size={22} 
                color={isActive ? "#fff" : "rgba(255,255,255,0.5)"} 
              />
              <Text style={[drawerStyles.menuLabel, isActive && drawerStyles.menuLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={drawerStyles.footer}>
        <TouchableOpacity style={drawerStyles.logoutBtn} onPress={logout}>
          <MaterialIcons name="logout" size={20} color="#e74c3c" />
          <Text style={drawerStyles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const drawerStyles = StyleSheet.create({
  header: {
    padding: 24,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.2)"
  },
  logoText: { color: "#60a5fa", fontSize: 20, fontWeight: "800" },
  tenantName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  tenantSub: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 },
  menuSection: { flex: 1, paddingHorizontal: 12, gap: 4 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12
  },
  menuItemActive: { backgroundColor: "rgba(255,255,255,0.05)" },
  menuLabel: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "600" },
  menuLabelActive: { color: "#fff" },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    marginBottom: 20
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10
  },
  logoutText: { color: "#e74c3c", fontSize: 15, fontWeight: "600" }
});

function AdminNavigator() {
  const isAdmin = useAuthStore((s) => !!s.token);

  if (!isAdmin) {
    return (
      <AdminStack.Navigator screenOptions={NAV_OPTIONS}>
        <AdminStack.Screen name="Login"         component={LoginScreen} />
        <AdminStack.Screen name="Register"      component={RegisterScreen} />
      </AdminStack.Navigator>
    );
  }

  return (
    <AdminDrawer.Navigator 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={DRAWER_OPTIONS}
    >
      <AdminDrawer.Screen name="Dashboard"     component={DashboardScreen} />
      <AdminDrawer.Screen name="MenuManager"   component={MenuManagerScreen} />
      <AdminDrawer.Screen name="TablesManager" component={TablesManagerScreen} />
      <AdminDrawer.Screen name="Staff"         component={StaffScreen} />
      <AdminDrawer.Screen name="Reports"       component={ReportsScreen} />
      <AdminDrawer.Screen name="Subscription"  component={SubscriptionScreen} />
      <AdminDrawer.Screen name="Notifications" component={NotificationsScreen} />
    </AdminDrawer.Navigator>
  );
}

// ── RootNavigator — le chef d'orchestre ────────────────────
export function RootNavigator() {
  const isAdmin    = useAuthStore((s) => !!s.token);
  const isStaff    = usePosStore((s) => !!s.staffSessionToken);

  // RÈGLE DE PRIORITÉ :
  // 1. Staff POS (session staff active)   → PosStack
  // 2. Admin connecté                     → AdminStack (sur Dashboard)
  // 3. Personne connecté                  → AdminStack (sur Login)

  return (
    <NavigationContainer>
      {isStaff
          ? <PosNavigator />            // Employé connecté via PIN
          : <AdminNavigator />          // Admin connecté ou vers Login
      }
    </NavigationContainer>
  );
}

// ── NOTE SUR LE FLUX RÉEL ─────────────────────────────────
// La tablette de caisse POS doit être configurée différemment
// du téléphone admin. En production, on peut :
// 1. Utiliser une URL de deep linking pour accéder au POS directement
//    Ex: restaurantos://pos → affiche directement PinLoginScreen
// 2. Ou ajouter un écran "Accueil" qui propose 2 boutons :
//    "Je suis le propriétaire" → AdminStack
//    "Je suis employé"         → PosStack