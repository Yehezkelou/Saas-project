import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, SafeAreaView, Dimensions, Platform
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AdminStackParams } from "../../navigation";
import { CycleApi, OrderApi, StaffApi } from "../../api";
import { useAuthStore } from "../../store/auth.store";
import { LoadingScreen } from "../../components/ui";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<AdminStackParams, "Dashboard">;

const SHORTCUTS = [
  { label: "Menu",           icon: "grid-view",     route: "MenuManager" },
  { label: "Mon équipe",     icon: "people",        route: "Staff" },
  { label: "Tables & QR",    icon: "dashboard",     route: "TablesManager" },
  { label: "Rapports",       icon: "receipt",       route: "Reports" },
  { label: "Abonnement",     icon: "credit-card",   route: "Subscription" },
  { label: "Notifications",  icon: "notifications", route: "Notifications" },
] as const;

export function DashboardScreen({ navigation }: Props) {
  const [cycle,        setCycle]        = useState<any>(null);
  const [report,       setReport]       = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [staffCount,   setStaffCount]   = useState<number | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const user   = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);

  const loadData = useCallback(async () => {
    try {
      const [c, staff] = await Promise.all([
        CycleApi.getActive(),
        StaffApi.list()
      ]);
      setCycle(c);
      setStaffCount(staff.length);

      if (c) {
        const [rep, orders] = await Promise.all([
          CycleApi.getReport(c.id),
          OrderApi.list({ cycleId: c.id }),
        ]);
        setReport(rep);
        setRecentOrders(orders.filter((o: any) => o.status !== "PAID").slice(0, 5));
      } else {
        setReport(null);
        setRecentOrders([]);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Removed early return for hooks safety

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const kpi = report?.summary;

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <LoadingScreen message="Chargement du tableau de bord..." />
      ) : (
        <>
          {/* Header Premium */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.menuBtn} 
                onPress={() => (navigation as any).openDrawer()}
              >
                <MaterialIcons name="menu" size={26} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerTitles}>
                <Text style={styles.headerGreeting}>Bonjour,</Text>
                <Text style={styles.headerAdminName}>{user?.email?.split('@')?.[0] ?? "Admin"}</Text>
              </View>
              <TouchableOpacity style={styles.profileBtn}>
                <MaterialIcons name="account-circle" size={32} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#fff" />}
          >
            {/* Équipe non configurée Warning */}
            {staffCount === 0 && (
              <View style={styles.warningBox}>
                <View style={styles.warningIcon}>
                  <MaterialIcons name="people" size={24} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.warningTitle}>Équipe non configurée</Text>
                  <Text style={styles.warningDesc}>
                    Vous n'avez pas encore ajouté de personnel. Vous ne pourrez pas vous connecter à la caisse.
                  </Text>
                </View>
                <TouchableOpacity style={styles.warningBtn} onPress={() => navigation.navigate("Staff")}>
                  <Text style={styles.warningBtnText}>Créer mon équipe</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Statut Caisse */}
            <View style={[styles.cycleBox, cycle ? styles.cycleBoxActive : styles.cycleBoxInactive]}>
              <View style={[styles.cycleDot, { backgroundColor: cycle ? "#2ecc71" : "#e74c3c" }]} />
              <Text style={[styles.cycleText, { color: cycle ? "#000" : "#fff", flex: 1 }]}>
                {cycle
                  ? `Session de caisse active depuis ${new Date(cycle.openedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. ${kpi?.totalOrders || 0} commande(s).`
                  : "La caisse est fermée. Vous ne pouvez pas recevoir de commandes."}
              </Text>
            </View>

            {/* KPIs */}
            <Text style={styles.sectionTitle}>Résumé des performances</Text>
            {kpi ? (
              <View style={styles.kpiGrid}>
                <StatCard label="Chiffre d'affaires" value={`${kpi.totalRevenue.toLocaleString("fr-FR")} FCFA`} icon="attach-money" color="#60a5fa" />
                <StatCard label="Total Commandes" value={String(kpi.totalOrders)} sub={`${kpi.paidOrders} encaissées`} icon="inventory-2" color="#fff" />
                <StatCard label="Bénéfice Net" value={`${(kpi.totalRevenue - kpi.totalExpenses).toLocaleString("fr-FR")} FCFA`} icon="trending-up" color={(kpi.totalRevenue - kpi.totalExpenses) >= 0 ? "#2ecc71" : "#e74c3c"} />
                <StatCard label="Dépenses Opé." value={`${kpi.totalExpenses.toLocaleString("fr-FR")} FCFA`} icon="inventory" color="rgba(255,255,255,0.6)" />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>
                  {cycle ? "En attente des premières transactions..." : "Veuillez ouvrir la caisse pour analyser les performances."}
                </Text>
              </View>
            )}

            {/* Commandes en attente */}
            <Text style={styles.sectionTitle}>Commandes en attente</Text>
            {recentOrders.length > 0 ? (
              <View style={styles.ordersList}>
                {recentOrders.map((order, i) => (
                  <View key={order.id} style={styles.orderItem}>
                    <View style={styles.orderTableIcon}>
                      <Text style={styles.orderTableText}>{order.table?.name?.split(' ')[1] || order.table?.name?.charAt(0) || "T"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderTableName} numberOfLines={1}>{order.table?.name}</Text>
                      <Text style={styles.orderMeta}>
                        {new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} • {order.items?.length} articles
                      </Text>
                    </View>
                    <View style={styles.orderStatusBadge}>
                      <Text style={styles.orderStatusText}>{order.status}</Text>
                    </View>
                    <Text style={styles.orderAmount}>{order.totalAmount.toLocaleString("fr-FR")} FCFA</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>Aucune commande en attente.</Text>
              </View>
            )}

            {/* Raccourcis */}
            <Text style={styles.sectionTitle}>Raccourcis</Text>
            <View style={styles.shortcutGrid}>
              {SHORTCUTS.map((s) => (
                <TouchableOpacity key={s.route} style={styles.shortcutCard} onPress={() => navigation.navigate(s.route as any)} activeOpacity={0.8}>
                  <View style={styles.shortcutIconWrap}>
                    <MaterialIcons name={s.icon} size={22} color="#60a5fa" />
                  </View>
                  <Text style={styles.shortcutLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <MaterialIcons name={icon} size={20} color="#fff" />
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 60 : 0,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  headerTitles: {
    flex: 1,
    marginLeft: 16,
  },
  headerGreeting: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500"
  },
  headerAdminName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4, textTransform: "capitalize" },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center"
  },
  content: { padding: 20, paddingBottom: 40 },
  
  warningBox: {
    backgroundColor: "rgba(255, 107, 0, 0.1)", borderColor: "rgba(255, 107, 0, 0.3)", borderWidth: 1,
    borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", flexWrap: "wrap",
    marginBottom: 24,
  },
  warningIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#ff6b00", alignItems: "center", justifyContent: "center" },
  warningTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 2 },
  warningDesc: { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 18, marginTop: 4 },
  warningBtn: {
    backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 12, width: "100%", alignItems: "center"
  },
  warningBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },

  cycleBox: {
    flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 24,
  },
  cycleBoxActive: { backgroundColor: "#fff" },
  cycleBoxInactive: { backgroundColor: "#0c0c0c", borderWidth: 1, borderColor: "#e74c3c" },
  cycleDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  cycleText: { fontSize: 13, fontWeight: "600" },

  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 16 },
  
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 24 },
  statCard: {
    width: "48%", backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.5)", marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  statSub: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4, fontWeight: "500" },

  emptyCard: { backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 32, alignItems: "center", marginBottom: 24, borderStyle: "dashed" },
  emptyCardText: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "500", textAlign: "center" },

  ordersList: { marginBottom: 24 },
  orderItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 14, marginBottom: 10
  },
  orderTableIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  orderTableText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  orderTableName: { fontWeight: "700", color: "#fff", fontSize: 14, marginBottom: 2 },
  orderMeta: { fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: "500" },
  orderStatusBadge: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 12 },
  orderStatusText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  orderAmount: { fontWeight: "800", color: "#fff", fontSize: 14 },

  shortcutGrid: { flexDirection: "row", flexWrap: "wrap", gap: width > 400 ? 12 : 8 },
  shortcutCard: {
    width: "31%", backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, padding: 14, alignItems: "center", marginBottom: 12
  },
  shortcutIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(96, 165, 250, 0.1)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  shortcutLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 14 }
});