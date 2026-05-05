// =============================================================
//  src/screens/pos/TablesScreen.tsx
//
//  Vue principale du staff après connexion PIN.
//  Montre toutes les tables avec leur statut en temps réel.
//  (Premium UI)
// =============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, Pressable, Platform
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PosStackParams } from "../../navigation";
import { TableApi, CycleApi } from "../../api";
import { usePosStore } from "../../store/pos.store";
import { layout, spacing, isTablet } from "../../theme";
import Icon from "react-native-vector-icons/Feather";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

type Props = NativeStackScreenProps<PosStackParams, "Tables">;

// Statut d'une table selon sa commande active
type TableStatus = "free" | "pending" | "accepted" | "ready";

const TABLE_STATUS_CONFIG: Record<TableStatus, {
  label:   string;
  color:   string;
  icon:    string;
  bg:      string;
  border:  string;
}> = {
  free:     { label: "Libre",      color: "#95a5a6", icon: "coffee",   bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.05)" },
  pending:  { label: "En attente", color: "#f1c40f", icon: "clock",    bg: "rgba(241,196,15,0.1)",   border: "rgba(241,196,15,0.3)" },
  accepted: { label: "En cuisine", color: "#3498db", icon: "play",     bg: "rgba(52,152,219,0.1)",   border: "rgba(52,152,219,0.3)" },
  ready:    { label: "Prête !",    color: "#2ecc71", icon: "check",    bg: "rgba(46,204,113,0.1)",   border: "rgba(46,204,113,0.4)" },
};

function getTableStatus(table: any): TableStatus {
  const order = table.activeOrder;
  if (!order) return "free";
  return (order.status?.toLowerCase() ?? "free") as TableStatus;
}

export function TablesScreen({ navigation }: Props) {
  const [tables,      setTables]      = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<any | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const staff         = usePosStore((s) => s.currentStaff);
  const setActiveCycleId = usePosStore((s) => s.setActiveCycle);
  const posLogout     = usePosStore((s) => s.logout);

  const loadData = useCallback(async () => {
    try {
      const [tableData, cycleData] = await Promise.all([
        TableApi.list(),
        CycleApi.getActive(),
      ]);
      setTables(tableData);
      setActiveCycle(cycleData);
      setActiveCycleId(cycleData?.id ?? null);
    } catch (err) {
      console.error("Erreur chargement tables:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Polling toutes les 10 secondes
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Nombre de tables par statut (pour le résumé en haut)
  const summary = {
    free:     tables.filter((t) => getTableStatus(t) === "free").length,
    occupied: tables.filter((t) => getTableStatus(t) !== "free").length,
    ready:    tables.filter((t) => getTableStatus(t) === "ready").length,
  };

  const renderTable = ({ item: table, index }: { item: any; index: number }) => {
    const status = getTableStatus(table);
    const config = TABLE_STATUS_CONFIG[status];

    return (
      <Animated.View layout={Layout.springify()} entering={FadeInDown.delay(index * 50).duration(400)} style={styles.tableCardWrapper}>
        <TouchableOpacity
          style={[
            styles.tableCard,
            { backgroundColor: config.bg, borderColor: config.border },
          ]}
          onPress={() => navigation.navigate("Order", {
            tableId:   table.id,
            tableName: table.name,
            orderId:   table.activeOrder?.id,
          })}
          activeOpacity={0.7}
        >
          {status === "ready" && (
            <View style={styles.readyIndicator} />
          )}

          <View style={styles.cardHeader}>
            <Text style={styles.tableName}>{table.name}</Text>
            <View style={[styles.statusIconBox, { backgroundColor: `${config.color}20` }]}>
              <Icon name={config.icon} size={14} color={config.color} />
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
            {table.activeOrder ? (
              <Text style={styles.tableAmount}>
                {table.activeOrder.totalAmount.toLocaleString("fr-FR")} F
              </Text>
            ) : (
              <Text style={styles.tableCapacity}>
                <Icon name="users" size={12} /> {table.capacity} pers.
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decors */}
      <View style={[styles.bgBlob, { top: -100, right: -100, backgroundColor: 'rgba(52,152,219,0.15)' }]} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>
            Bonjour, <Text style={{ color: "#fff" }}>{staff?.name?.split(" ")?.[0] ?? "Staff"}</Text> 👋
          </Text>
          <Text style={styles.headerRole}>{staff?.role?.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => navigation.navigate("OrderManagement")}
          >
            <Icon name="list" size={16} color="#fff" />
            {isTablet && <Text style={styles.headerBtnText}>Suivi</Text>}
          </Pressable>
          <Pressable
            style={styles.headerBtn}
            onPress={() => navigation.navigate("Kitchen")}
          >
            <Icon name="coffee" size={16} color="#fff" />
            {isTablet && <Text style={styles.headerBtnText}>Cuisine</Text>}
          </Pressable>
          <Pressable
            style={styles.headerBtn}
            onPress={() => navigation.navigate("Cycle")}
          >
            <Icon name="dollar-sign" size={16} color="#fff" />
            {isTablet && <Text style={styles.headerBtnText}>Caisse</Text>}
          </Pressable>
          <Pressable
            style={[styles.headerBtn, styles.headerBtnDanger]}
            onPress={() => posLogout()}
          >
            <Icon name="power" size={16} color="#e74c3c" />
            {isTablet && <Text style={[styles.headerBtnText, { color: "#e74c3c" }]}>Quitter</Text>}
          </Pressable>
        </View>
      </View>

      {/* ── Statut cycle ── */}
      <View style={[
        styles.cycleBanner,
        { backgroundColor: activeCycle ? "rgba(46,204,113,0.1)" : "rgba(231,76,60,0.1)", borderColor: activeCycle ? "rgba(46,204,113,0.2)" : "rgba(231,76,60,0.2)" },
      ]}>
        <View style={[
          styles.cycleDot,
          { backgroundColor: activeCycle ? "#2ecc71" : "#e74c3c" },
        ]} />
        <Text style={styles.cycleText}>
          {activeCycle
            ? `Caisse ouverte depuis ${new Date(activeCycle.openedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
            : "Caisse fermée — ouvrez la caisse pour prendre des commandes"}
        </Text>
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate("Order", { tableId: "", tableName: "Vente Directe" })}
        >
          <Icon name="plus" size={16} color="#fff" />
          <Text style={styles.quickActionText}>Vente Directe</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtnOutline}
          onPress={() => navigation.navigate("Cycle")}
        >
          <Icon name="dollar-sign" size={16} color="#FF6B00" />
          <Text style={[styles.quickActionText, { color: "#FF6B00" }]}>Dépense</Text>
        </TouchableOpacity>
      </View>

      {/* ── Résumé rapide ── */}
      <View style={styles.summary}>
        {[
          { label: "Libres",    value: summary.free,     color: "#95a5a6", icon: "coffee" },
          { label: "Occupées",  value: summary.occupied,  color: "#f1c40f", icon: "users" },
          { label: "À servir",  value: summary.ready,     color: "#2ecc71", icon: "check-circle" },
        ].map((s) => (
          <View key={s.label} style={styles.summaryItem}>
            <View style={[styles.summaryIconBox, { backgroundColor: `${s.color}15` }]}>
              <Icon name={s.icon} size={16} color={s.color} />
            </View>
            <View>
              <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Grille des tables ── */}
      {loading ? (
         <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: "#fff" }}>Chargement...</Text></View>
      ) : (
        <FlatList
          data={tables.filter((t) => t.isActive)}
          renderItem={renderTable}
          keyExtractor={(t) => t.id}
          numColumns={layout.tableColumns}
          key={`tables-${layout.tableColumns}`}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3498db" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Icon name="grid" size={48} color="rgba(255,255,255,0.2)" />
              </View>
              <Text style={styles.emptyTitle}>Aucune table configurée</Text>
              <Text style={styles.emptySubtitle}>Demandez à l'administrateur de créer des tables</Text>
            </View>
          }
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121214", position: "relative" },
  bgBlob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, filter: [{ blur: 80 }], zIndex: 0 },
  
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)", paddingHorizontal: layout.screenPadding,
    paddingTop: Platform.OS === "android" ? 60 : spacing.lg, paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", zIndex: 1,
  },
  headerGreeting: { fontSize: 18, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  headerRole: { fontSize: 13, color: "#FF6B00", fontWeight: "700", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  headerBtnDanger: { backgroundColor: "rgba(231,76,60,0.1)", borderColor: "rgba(231,76,60,0.3)" },
  headerBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  cycleBanner: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: layout.screenPadding,
    paddingVertical: 12, gap: 12, borderWidth: 1,
  },
  cycleDot: { width: 10, height: 10, borderRadius: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4 },
  cycleText: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "600" },

  summary: {
    flexDirection: "row", paddingHorizontal: layout.screenPadding, paddingVertical: 20, gap: 20,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
  },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: "600" },

  quickActions: {
    flexDirection: "row", paddingHorizontal: layout.screenPadding, paddingVertical: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
  },
  quickActionBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FF6B00", paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14,
  },
  quickActionBtnOutline: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  quickActionText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  grid: { padding: layout.screenPadding, paddingBottom: 100 },
  gridRow: { justifyContent: "flex-start", marginBottom: 12, gap: 12 },

  tableCardWrapper: { flex: 1, minWidth: isTablet ? "22%" : "45%" },
  tableCard: {
    borderRadius: 24, borderWidth: 1.5, padding: 16,
    minHeight: 120, justifyContent: "space-between", position: "relative", overflow: "hidden",
  },
  readyIndicator: { position: "absolute", top: 0, left: 0, right: 0, height: 6, backgroundColor: "#2ecc71" },
  
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tableName: { fontSize: 18, fontWeight: "800", color: "#fff" },
  statusIconBox: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  
  cardBody: { marginTop: 16 },
  statusLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  tableAmount: { fontSize: 16, fontWeight: "900", color: "#fff" },
  tableCapacity: { fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: "600", flexDirection: "row", alignItems: "center" },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.02)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "rgba(255,255,255,0.5)" },
});