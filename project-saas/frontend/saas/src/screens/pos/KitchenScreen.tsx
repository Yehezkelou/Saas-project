// =============================================================
//  src/screens/pos/KitchenScreen.tsx
//  Vue cuisine — file des commandes à préparer
//  Le cuisinier/barman voit les commandes et change leur statut (Premium UI)
// =============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, Alert, Platform
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PosStackParams } from "../../navigation";
import { OrderApi, Order } from "../../api";
import { layout, spacing } from "../../theme";
import Icon from "react-native-vector-icons/Feather";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

type KitchenProps = NativeStackScreenProps<PosStackParams, "Kitchen">;

export function KitchenScreen({ navigation }: KitchenProps) {
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [updating,    setUpdating]    = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      // Charger les commandes actives (pas PAID)
      const data = await OrderApi.list({ status: "PENDING" });
      const accepted = await OrderApi.list({ status: "ACCEPTED" });
      setOrders([...data, ...accepted].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (order: Order, newStatus: string) => {
    try {
      setUpdating(order.id);
      await OrderApi.updateStatus(order.id, newStatus);
      await loadOrders();
    } catch (error: any) {
      Alert.alert("Erreur", error.response?.data?.message ?? "Impossible de mettre à jour");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PENDING": return "#e67e22";
      case "ACCEPTED": return "#3498db";
      case "READY": return "#2ecc71";
      default: return "#95a5a6";
    }
  };

  const renderOrder = ({ item: order, index }: { item: Order; index: number }) => {
    const isUpdating = updating === order.id;
    const minutesAgo = Math.floor(
      (Date.now() - new Date(order.createdAt).getTime()) / 60000
    );
    const isUrgent = minutesAgo >= 15;
    const statusColor = getStatusColor(order.status);

    return (
      <Animated.View layout={Layout.springify()} entering={FadeInDown.delay(index * 100).duration(400)} style={[styles.orderCard, isUrgent && styles.orderCardUrgent]}>
        {isUrgent && (
          <View style={styles.urgentBanner}>
            <Icon name="alert-triangle" size={14} color="#e74c3c" />
            <Text style={styles.urgentText}>En attente depuis {minutesAgo} min</Text>
          </View>
        )}

        {/* En-tête */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderTable}>{order.table?.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
          </View>
          <Text style={styles.orderTime}><Icon name="clock" size={12} /> {minutesAgo} min</Text>
        </View>

        {/* Articles */}
        <View style={styles.itemsContainer}>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              <Text style={styles.itemName}>{item.product?.name}</Text>
            </View>
          ))}
        </View>

        {/* Bouton action */}
        <View style={styles.orderActions}>
          {order.status === "PENDING" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnAccept]}
              onPress={() => handleStatusChange(order, "ACCEPTED")}
              disabled={isUpdating}
            >
              {isUpdating ? (
                 <Text style={[styles.actionBtnText, { color: "#3498db" }]}>...</Text>
              ) : (
                <>
                  <Icon name="play" size={16} color="#3498db" />
                  <Text style={[styles.actionBtnText, { color: "#3498db" }]}>Prendre en charge</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {order.status === "ACCEPTED" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnReady]}
              onPress={() => handleStatusChange(order, "READY")}
              disabled={isUpdating}
            >
              {isUpdating ? (
                 <Text style={[styles.actionBtnText, { color: "#2ecc71" }]}>...</Text>
              ) : (
                <>
                  <Icon name="check" size={16} color="#2ecc71" />
                  <Text style={[styles.actionBtnText, { color: "#2ecc71" }]}>Prêt à servir</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decors */}
      <View style={[styles.bgBlob, { top: -100, right: -100, backgroundColor: 'rgba(230,126,34,0.1)' }]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#e67e22" />
          <Text style={styles.backText}>Tables</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vue Cuisine</Text>
        <View style={[styles.countBadge, { backgroundColor: orders.length > 0 ? "#e74c3c" : "#2ecc71" }]}>
          <Text style={styles.countBadgeText}>{orders.length}</Text>
        </View>
      </View>

      {loading ? (
         <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: "#fff" }}>Chargement...</Text></View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor="#e67e22" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Icon name="check-circle" size={48} color="#2ecc71" />
              </View>
              <Text style={styles.emptyTitle}>Aucune commande en cours</Text>
              <Text style={styles.emptySubtitle}>Toutes les commandes sont servies 🎉</Text>
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)", paddingHorizontal: layout.screenPadding,
    paddingTop: Platform.OS === "android" ? 60 : spacing.lg, paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", zIndex: 1,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 80 },
  backText: { color: "#e67e22", fontSize: 15, fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", flex: 1, textAlign: "center" },
  countBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  countBadgeText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  list: { padding: layout.screenPadding, gap: 16, paddingBottom: 100 },

  orderCard: {
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden", position: "relative"
  },
  orderCardUrgent: { borderColor: "rgba(231,76,60,0.4)", backgroundColor: "rgba(231,76,60,0.05)" },
  
  urgentBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(231,76,60,0.15)", marginHorizontal: -20, marginTop: -20, padding: 8, marginBottom: 16 },
  urgentText: { color: "#e74c3c", fontSize: 12, fontWeight: "700" },

  orderHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  orderTable: { fontSize: 18, fontWeight: "800", color: "#fff", flex: 1 },
  
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "800" },
  
  orderTime: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "600", flexDirection: "row", alignItems: "center" },

  itemsContainer: { backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 16, padding: 16, marginBottom: 16 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  itemQty: { fontSize: 15, fontWeight: "800", color: "#e67e22", width: 28 },
  itemName: { fontSize: 15, color: "#fff", flex: 1, fontWeight: "600" },

  orderActions: { marginTop: 4 },
  actionBtn: { borderRadius: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1 },
  actionBtnAccept: { backgroundColor: "rgba(52,152,219,0.1)", borderColor: "rgba(52,152,219,0.3)" },
  actionBtnReady: { backgroundColor: "rgba(46,204,113,0.1)", borderColor: "rgba(46,204,113,0.3)" },
  actionBtnText: { fontSize: 15, fontWeight: "800" },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(46,204,113,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "rgba(255,255,255,0.5)" },
});
