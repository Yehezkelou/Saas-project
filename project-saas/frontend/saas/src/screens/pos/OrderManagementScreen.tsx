// =============================================================
//  src/screens/pos/OrderManagementScreen.tsx
//  Gestion des commandes — Onglets : En attente / Prêtes / Payées
//  Réplique la logique de OrderManagementPage.tsx du web
//  (Premium UI)
// =============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, Alert, Platform, Modal, ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PosStackParams } from "../../navigation";
import { OrderApi, Order } from "../../api";
import { usePosStore } from "../../store/pos.store";
import Icon from "react-native-vector-icons/Feather";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";

type Props = NativeStackScreenProps<PosStackParams, "OrderManagement">;

type TabStatus = "PENDING" | "VALIDATED" | "PAID";

const TABS: { id: TabStatus; label: string; icon: string; color: string }[] = [
  { id: "PENDING",   label: "En attente",  icon: "inbox",        color: "#f39c12" },
  { id: "VALIDATED", label: "Prêtes",       icon: "check-circle", color: "#2ecc71" },
  { id: "PAID",      label: "Payées",       icon: "archive",      color: "rgba(255,255,255,0.5)" },
];

export function OrderManagementScreen({ navigation }: Props) {
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [activeTab,     setActiveTab]     = useState<TabStatus>("PENDING");
  const [updating,      setUpdating]      = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const activeCycleId = usePosStore((s) => s.activeCycleId);

  const loadOrders = useCallback(async () => {
    try {
      const filters: any = { status: activeTab };
      if (activeTab === "PAID" && activeCycleId) {
        filters.cycleId = activeCycleId;
      }
      const data = await OrderApi.list(filters);
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, activeCycleId]);

  useEffect(() => {
    setLoading(true);
    loadOrders();
    const iv = setInterval(loadOrders, 8000);
    return () => clearInterval(iv);
  }, [loadOrders]);

  const changeStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await OrderApi.updateStatus(orderId, status);
      await loadOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch {
      Alert.alert("Erreur", "Impossible de mettre à jour le statut");
    } finally {
      setUpdating(null);
    }
  };

  // ── Order Card ──
  const renderOrder = ({ item: order, index }: { item: Order; index: number }) => {
    const time = new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isUpdatingThis = updating === order.id;

    return (
      <Animated.View layout={Layout.springify()} entering={FadeInDown.delay(index * 70).duration(400)}>
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => setSelectedOrder(order)}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.orderCardHeader}>
            <Text style={styles.orderTableName}>{order.table?.name ?? "Vente Directe"}</Text>
            <View style={styles.orderTimeBox}>
              <Icon name="clock" size={12} color="rgba(255,255,255,0.4)" />
              <Text style={styles.orderTime}>{time}</Text>
            </View>
          </View>

          {/* Items preview */}
          <View style={styles.orderItems}>
            {order.items?.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.orderItemRow}>
                <Text style={styles.orderItemQty}>{item.quantity}×</Text>
                <Text style={styles.orderItemName} numberOfLines={1}>{item.product?.name}</Text>
              </View>
            ))}
            {(order.items?.length ?? 0) > 3 && (
              <Text style={styles.orderItemMore}>+ {order.items.length - 3} autres articles</Text>
            )}
          </View>

          {/* Total */}
          <Text style={styles.orderTotal}>{order.totalAmount?.toLocaleString("fr-FR")} FCFA</Text>

          {/* Actions */}
          <View style={styles.orderActions}>
            {activeTab === "PENDING" && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnValidate]}
                  onPress={() => changeStatus(order.id, "VALIDATED")}
                  disabled={isUpdatingThis}
                >
                  <Icon name="check" size={16} color="#2ecc71" />
                  <Text style={[styles.actionBtnText, { color: "#2ecc71" }]}>
                    {isUpdatingThis ? "..." : "Valider"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnReject]}
                  onPress={() => changeStatus(order.id, "REJECTED")}
                  disabled={isUpdatingThis}
                >
                  <Text style={[styles.actionBtnText, { color: "#e74c3c" }]}>
                    {isUpdatingThis ? "..." : "Rejeter"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {activeTab === "VALIDATED" && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPay]}
                onPress={() => navigation.navigate("Payment", {
                  orderId: order.id,
                  tableId: order.tableId ?? "",
                  tableName: order.table?.name ?? "Vente Directe",
                  totalAmount: order.totalAmount,
                })}
              >
                <Icon name="credit-card" size={16} color="#FF6B00" />
                <Text style={[styles.actionBtnText, { color: "#FF6B00" }]}>Encaisser</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ── Detail Modal ──
  const renderDetailModal = () => {
    if (!selectedOrder) return null;
    const time = new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isUpdatingThis = updating === selectedOrder.id;

    return (
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(400)} style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Close */}
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedOrder(null)}>
                <Icon name="x" size={24} color="#fff" />
              </TouchableOpacity>

              {/* Info header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTableIcon}>
                  <Icon name="map-pin" size={24} color="#FF6B00" />
                </View>
                <View>
                  <Text style={styles.modalTableName}>{selectedOrder.table?.name ?? "Vente Directe"}</Text>
                  <Text style={styles.modalOrderId}>#ORD-{selectedOrder.id.slice(0, 5).toUpperCase()}</Text>
                </View>
              </View>

              {/* Time & articles count */}
              <View style={styles.modalInfoGrid}>
                <View style={styles.modalInfoCard}>
                  <View style={styles.modalInfoLabel}>
                    <Icon name="clock" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.modalInfoLabelText}>Heure</Text>
                  </View>
                  <Text style={styles.modalInfoValue}>{time}</Text>
                </View>
                <View style={styles.modalInfoCard}>
                  <View style={styles.modalInfoLabel}>
                    <Icon name="hash" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.modalInfoLabelText}>Articles</Text>
                  </View>
                  <Text style={styles.modalInfoValue}>{selectedOrder.items?.length ?? 0} produits</Text>
                </View>
              </View>

              {/* Items list */}
              <View style={styles.modalItemsHeader}>
                <Icon name="shopping-bag" size={14} color="rgba(255,255,255,0.4)" />
                <Text style={styles.modalItemsHeaderText}>Récapitulatif du panier</Text>
              </View>
              {selectedOrder.items?.map((item) => (
                <View key={item.id} style={styles.modalItemRow}>
                  <View style={styles.modalItemLeft}>
                    <View style={styles.modalItemQtyBox}>
                      <Text style={styles.modalItemQty}>{item.quantity}×</Text>
                    </View>
                    <View>
                      <Text style={styles.modalItemName}>{item.product?.name}</Text>
                      <Text style={styles.modalItemUnit}>{item.price?.toLocaleString("fr-FR")} / unité</Text>
                    </View>
                  </View>
                  <Text style={styles.modalItemTotal}>{(item.price * item.quantity).toLocaleString("fr-FR")}</Text>
                </View>
              ))}

              {/* Total */}
              <View style={styles.modalTotalBox}>
                <View style={styles.modalTotalRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Icon name="credit-card" size={20} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.modalTotalLabel}>Total Commande</Text>
                  </View>
                  <Text style={styles.modalTotalAmount}>
                    {(selectedOrder.totalAmount ?? 0).toLocaleString("fr-FR")} F
                  </Text>
                </View>

                {/* Action buttons */}
                <View style={styles.modalBtnRow}>
                  {selectedOrder.status === "PENDING" && (
                    <>
                      <TouchableOpacity
                        style={[styles.modalBtn, { backgroundColor: "#2ecc71", flex: 1 }]}
                        onPress={() => changeStatus(selectedOrder.id, "VALIDATED")}
                        disabled={isUpdatingThis}
                      >
                        <Icon name="check-circle" size={18} color="#fff" />
                        <Text style={styles.modalBtnTextWhite}>{isUpdatingThis ? "..." : "Valider"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalBtn, { backgroundColor: "rgba(255,59,48,0.1)", width: 100 }]}
                        onPress={() => changeStatus(selectedOrder.id, "REJECTED")}
                        disabled={isUpdatingThis}
                      >
                        <Text style={[styles.modalBtnTextWhite, { color: "#ff3b30" }]}>Rejeter</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedOrder.status === "VALIDATED" && (
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: "#FF6B00", flex: 1 }]}
                      onPress={() => {
                        setSelectedOrder(null);
                        navigation.navigate("Payment", {
                          orderId: selectedOrder.id,
                          tableId: selectedOrder.tableId ?? "",
                          tableName: selectedOrder.table?.name ?? "Vente Directe",
                          totalAmount: selectedOrder.totalAmount,
                        });
                      }}
                    >
                      <Icon name="credit-card" size={18} color="#fff" />
                      <Text style={styles.modalBtnTextWhite}>Encaisser</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.bgBlob, { top: -100, left: -100, backgroundColor: "rgba(255,107,0,0.08)" }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#FF6B00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion des Commandes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => { setActiveTab(tab.id); setLoading(true); }}
            >
              <Icon name={tab.icon} size={18} color={isActive ? tab.color : "rgba(255,255,255,0.4)"} />
              <Text style={[styles.tabText, isActive && { color: "#fff" }]}>{tab.label}</Text>
              {isActive && <View style={[styles.tabIndicator, { backgroundColor: tab.color }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      {loading && orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: "rgba(255,255,255,0.5)" }}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadOrders(); }}
              tintColor="#FF6B00"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Icon name="inbox" size={48} color="rgba(255,255,255,0.15)" />
              </View>
              <Text style={styles.emptyTitle}>Aucune commande</Text>
              <Text style={styles.emptySubtitle}>Aucune commande dans cette section</Text>
            </View>
          }
        />
      )}

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121214", position: "relative" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  bgBlob: { position: "absolute", width: 300, height: 300, borderRadius: 150, filter: [{ blur: 80 }], zIndex: 0 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 60 : 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", zIndex: 1,
  },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  // ── Tabs ──
  tabsContainer: {
    flexDirection: "row", paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", gap: 8,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 12, borderRadius: 14, position: "relative",
  },
  tabActive: { backgroundColor: "rgba(255,255,255,0.05)" },
  tabText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.4)" },
  tabIndicator: { position: "absolute", bottom: 0, left: "20%", right: "20%", height: 3, borderRadius: 2 },

  list: { padding: 20, paddingBottom: 100, gap: 16 },

  // ── Order Card ──
  orderCard: {
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
  },
  orderCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  orderTableName: { fontSize: 18, fontWeight: "800", color: "#FF6B00" },
  orderTimeBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  orderTime: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.4)" },

  orderItems: { marginBottom: 12 },
  orderItemRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  orderItemQty: { fontWeight: "800", color: "rgba(255,255,255,0.6)", fontSize: 14 },
  orderItemName: { fontWeight: "600", color: "rgba(255,255,255,0.9)", fontSize: 14, flex: 1 },
  orderItemMore: { fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: "700", marginTop: 4 },

  orderTotal: { fontSize: 16, fontWeight: "900", color: "#fff", marginBottom: 16 },

  orderActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  actionBtnValidate: { backgroundColor: "rgba(46,204,113,0.1)", borderColor: "rgba(46,204,113,0.3)" },
  actionBtnReject: { backgroundColor: "rgba(231,76,60,0.1)", borderColor: "rgba(231,76,60,0.3)", flex: 0.4 },
  actionBtnPay: { backgroundColor: "rgba(255,107,0,0.1)", borderColor: "rgba(255,107,0,0.3)" },
  actionBtnText: { fontSize: 14, fontWeight: "800" },

  // ── Empty ──
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.02)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)" },

  // ── Detail Modal ──
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#1a1a1e", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, maxHeight: "90%",
  },
  modalClose: { position: "absolute", top: 0, right: 0, zIndex: 10, padding: 4 },

  modalHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  modalTableIcon: {
    width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(255,107,0,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  modalTableName: { fontSize: 20, fontWeight: "800", color: "#fff" },
  modalOrderId: { fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: "600", marginTop: 2 },

  modalInfoGrid: { flexDirection: "row", gap: 16, marginBottom: 24 },
  modalInfoCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
  },
  modalInfoLabel: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  modalInfoLabelText: { fontSize: 12, fontWeight: "800", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" },
  modalInfoValue: { fontSize: 16, fontWeight: "700", color: "#fff" },

  modalItemsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  modalItemsHeaderText: { fontSize: 12, fontWeight: "800", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" },

  modalItemRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 18,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.03)", marginBottom: 10,
  },
  modalItemLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  modalItemQtyBox: { backgroundColor: "rgba(255,107,0,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  modalItemQty: { fontWeight: "800", color: "#FF6B00", fontSize: 15 },
  modalItemName: { fontSize: 15, fontWeight: "700", color: "#fff" },
  modalItemUnit: { fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 },
  modalItemTotal: { fontSize: 15, fontWeight: "800", color: "rgba(255,255,255,0.9)" },

  modalTotalBox: {
    marginTop: 16, padding: 24, backgroundColor: "rgba(255,107,0,0.05)",
    borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,107,0,0.1)",
  },
  modalTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTotalLabel: { fontSize: 15, fontWeight: "700", color: "rgba(255,255,255,0.6)" },
  modalTotalAmount: { fontSize: 28, fontWeight: "900", color: "#FF6B00", letterSpacing: -1 },

  modalBtnRow: { flexDirection: "row", gap: 12 },
  modalBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, height: 54,
  },
  modalBtnTextWhite: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
