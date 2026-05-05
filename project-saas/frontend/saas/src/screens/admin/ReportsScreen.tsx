import React, { useEffect, useState } from "react";
import { 
  FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, 
  Platform, TextInput, Alert, ScrollView, Modal, Image, ActivityIndicator 
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AdminStackParams } from "../../navigation";
import { CycleApi, StatisticApi, SubscriptionApi } from "../../api";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { LoadingScreen } from "../../components/ui";

type ReportsProps = NativeStackScreenProps<AdminStackParams, "Reports">;

const BASE_URL = "http://172.16.160.68:3000";
const formatImageUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export function ReportsScreen({ navigation }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<"sessions" | "statistics">("sessions");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sessions
  const [cycles, setCycles] = useState<any[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(true);

  // Statistics
  const [statistics, setStatistics] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statLoading, setStatLoading] = useState(false);
  const [statisticDaysLimit, setStatisticDaysLimit] = useState(2);
  const [expandedStatId, setExpandedStatId] = useState<string | null>(null);

  // Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [cycleReport, setCycleReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    try {
      const data = await CycleApi.list();
      setCycles(data);
    } finally {
      setLoadingCycles(false);
    }
  };

  useEffect(() => {
    if (activeTab === "statistics") {
      if (statistics.length === 0) {
        setLoadingStats(true);
        StatisticApi.list()
          .then(setStatistics)
          .catch(err => {
            console.error("Stats load error:", err);
            Alert.alert("Erreur", "Impossible de charger l'historique des statistiques.");
          })
          .finally(() => setLoadingStats(false));
      }
      SubscriptionApi.get().then((res: any) => {
        const currentPlan = res.availablePlans?.find((p: any) => p.isCurrent);
        if (currentPlan && currentPlan.limits?.statistic_days) {
          setStatisticDaysLimit(currentPlan.limits.statistic_days);
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  const calculateStatistic = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Erreur", "Veuillez saisir les deux dates au format AAAA-MM-JJ.");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      Alert.alert("Erreur", "La date de début doit être antérieure à la date de fin.");
      return;
    }
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > statisticDaysLimit) {
      Alert.alert("Abonnement insuffisant", `Votre plan actuel limite l'analyse à ${statisticDaysLimit} jours maximum.`);
      return;
    }
    setStatLoading(true);
    try {
      const data = await StatisticApi.calculate(startDate, endDate);
      setStatistics([data, ...statistics]);
      setExpandedStatId(data.id);
      Alert.alert("Succès", "L'analyse a été générée.");
    } catch (e: any) {
      Alert.alert("Erreur", e.response?.data?.message || "Erreur lors du calcul");
    } finally {
      setStatLoading(false);
    }
  };

  const openCycleDetails = async (cycle: any) => {
    setSelectedCycle(cycle);
    setShowDetailsModal(true);
    setLoadingReport(true);
    try {
      const report = await CycleApi.getReport(cycle.id);
      setCycleReport(report);
    } catch (err: any) {
      console.error("Report details error:", err);
      Alert.alert("Erreur", "Impossible de charger les détails du rapport.");
    } finally {
      setLoadingReport(false);
    }
  };

  const filteredCycles = cycles.filter(c => {
    const dateStr = new Date(c.openedAt).toLocaleDateString("fr-FR").toLowerCase();
    return dateStr.includes(searchQuery.toLowerCase());
  });

  const renderSession = ({ item: cycle }: { item: any }) => (
    <TouchableOpacity style={styles.cycleCard} onPress={() => openCycleDetails(cycle)}>
      <View style={styles.cycleHeader}>
        <View style={styles.dateBox}>
          <Text style={styles.cycleDay}>{new Date(cycle.openedAt).getDate()}</Text>
          <Text style={styles.cycleMonth}>{new Date(cycle.openedAt).toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.cycleDate}>
            {new Date(cycle.openedAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
          <Text style={styles.cycleTime}>
            {new Date(cycle.openedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            {cycle.closedAt ? ` - ${new Date(cycle.closedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ' - En cours'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cycle.status === "CLOSED" ? "rgba(46, 204, 113, 0.15)" : "rgba(96, 165, 250, 0.15)" }]}>
          <Text style={{ fontSize: 10, color: cycle.status === "CLOSED" ? "#2ecc71" : "#60a5fa", fontWeight: "800", textTransform: "uppercase" }}>
            {cycle.status === "CLOSED" ? "Fermé" : "Actif"}
          </Text>
        </View>
      </View>

      {cycle.report ? (
        <View style={styles.miniStats}>
          <View style={styles.miniStatItem}>
            <Text style={styles.miniStatLabel}>Ventes</Text>
            <Text style={[styles.miniStatValue, { color: "#60a5fa" }]}>
              {(cycle.report.totalRevenue ?? cycle.report.totalRevenu ?? 0).toLocaleString("fr-FR")} FCFA
            </Text>
          </View>
          <View style={styles.miniStatItem}>
            <Text style={styles.miniStatLabel}>Bénéfice</Text>
            <Text style={[styles.miniStatValue, { color: "#2ecc71" }]}>
              {(cycle.report.netProfit ?? 0).toLocaleString("fr-FR")} FCFA
            </Text>
          </View>
          <View style={[styles.miniStatItem, { flex: 0.6 }]}>
            <Text style={styles.miniStatLabel}>Articles</Text>
            <Text style={[styles.miniStatValue, { color: "#fff" }]}>
              {cycle.report.totalItems || cycle.report.orderCount || 0}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.2)" />
        </View>
      ) : (
        <View style={styles.noReportBox}>
          <Text style={styles.noReportText}>En attente de clôture...</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStatistic = ({ item: stat }: { item: any }) => {
    const isExpanded = expandedStatId === stat.id;
    return (
      <View style={styles.cycleCard}>
        <TouchableOpacity style={styles.cycleHeader} onPress={() => setExpandedStatId(isExpanded ? null : stat.id)}>
          <View style={styles.statIconBox}>
            <MaterialIcons name="analytics" size={20} color="#60a5fa" />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.cycleDate}>Analyse de période</Text>
            <Text style={styles.cycleTime}>
              Du {new Date(stat.startDate).toLocaleDateString("fr-FR")} au {new Date(stat.endDate).toLocaleDateString("fr-FR")}
            </Text>
          </View>
          <MaterialIcons name={isExpanded ? "expand-less" : "expand-more"} size={24} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.reportContent}>
            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Revenus totaux</Text>
              <Text style={[styles.reportValue, { color: "#60a5fa" }]}>{(stat.totalRevenue ?? 0).toLocaleString("fr-FR")} FCFA</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Bénéfice Net</Text>
              <Text style={[styles.reportValue, { color: stat.netProfit >= 0 ? "#2ecc71" : "#e74c3c", fontSize: 16 }]}>
                {stat.netProfit?.toLocaleString("fr-FR")} FCFA
              </Text>
            </View>

            {stat.topProducts && stat.topProducts.length > 0 && (
              <View style={styles.topProductsSection}>
                <Text style={styles.sectionTitle}>Top Produits</Text>
                {Array.isArray(stat.topProducts) && stat.topProducts.map((p: any, idx: number) => (
                    <View style={styles.topProductItem}>
                      <View style={styles.topProductRank}>
                        <Text style={styles.topProductRankText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.topProductImage}>
                        {p.imageUrl ? (
                          <Image source={{ uri: formatImageUrl(p.imageUrl) }} style={{ width: "100%", height: "100%", borderRadius: 6 }} />
                        ) : (
                          <MaterialIcons name="fastfood" size={16} color="rgba(255,255,255,0.2)" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.topProductText} numberOfLines={1}>{p.name}</Text>
                        <Text style={styles.topProductMeta}>{p.quantitySold} vendus</Text>
                      </View>
                      <Text style={styles.topProductRevenue}>{p.revenue?.toLocaleString("fr-FR")} FCFA</Text>
                    </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loadingCycles ? (
        <LoadingScreen message="Chargement des rapports..." />
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.backBtn} onPress={() => (navigation as any).openDrawer()}>
                <MaterialIcons name="menu" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Rapports Financiers</Text>
              <View style={{ width: 40 }} />
            </View>

            {activeTab === "sessions" && (
              <View style={styles.searchBarWrapper}>
                <View style={styles.searchBar}>
                  <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Rechercher une date (ex: 12/05)..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === "sessions" && styles.activeTab]} 
              onPress={() => setActiveTab("sessions")}
            >
              <Text style={[styles.tabText, activeTab === "sessions" && styles.activeTabText]}>Sessions</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === "statistics" && styles.activeTab]} 
              onPress={() => setActiveTab("statistics")}
            >
              <Text style={[styles.tabText, activeTab === "statistics" && styles.activeTabText]}>Analyses</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            {activeTab === "sessions" ? (
              <FlatList
                data={filteredCycles}
                keyExtractor={(c) => c.id}
                contentContainerStyle={styles.list}
                renderItem={renderSession}
                ListEmptyComponent={
                  <View style={styles.emptyCard}>
                    <MaterialIcons name="receipt-long" size={48} color="rgba(255,255,255,0.2)" style={{marginBottom: 16}} />
                    <Text style={styles.emptyCardTitle}>Aucune session</Text>
                    <Text style={styles.emptyCardText}>Les rapports apparaîtront ici après chaque fermeture de caisse.</Text>
                  </View>
                }
              />
            ) : (
              <FlatList
                data={statistics}
                keyExtractor={(s) => s.id}
                contentContainerStyle={styles.list}
                renderItem={renderStatistic}
                ListHeaderComponent={
                  <View style={styles.calcCard}>
                    <Text style={styles.calcTitle}>Nouvelle analyse ({statisticDaysLimit} jours max)</Text>
                    <View style={styles.inputRow}>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Début (AAAA-MM-JJ)</Text>
                        <TextInput 
                          style={styles.input} 
                          placeholder="ex: 2024-05-01" 
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={startDate}
                          onChangeText={setStartDate}
                        />
                      </View>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Fin (AAAA-MM-JJ)</Text>
                        <TextInput 
                          style={styles.input} 
                          placeholder="ex: 2024-05-31" 
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={endDate}
                          onChangeText={setEndDate}
                        />
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.calcBtn, statLoading && { opacity: 0.7 }]} 
                      onPress={calculateStatistic}
                      disabled={statLoading}
                    >
                      <MaterialIcons name="trending-up" size={18} color="#000" />
                      <Text style={styles.calcBtnText}>{statLoading ? "Analyse..." : "Lancer l'analyse"}</Text>
                    </TouchableOpacity>
                  </View>
                }
                ListEmptyComponent={
                  loadingStats ? null : (
                    <View style={styles.emptyCard}>
                      <MaterialIcons name="bar-chart" size={48} color="rgba(255,255,255,0.2)" style={{marginBottom: 16}} />
                      <Text style={styles.emptyCardTitle}>Aucune analyse</Text>
                      <Text style={styles.emptyCardText}>Générez une analyse pour voir les statistiques détaillées.</Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        </>
      )}

      {/* Détails du Rapport */}
      <Modal visible={showDetailsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)} style={styles.modalCloseBtn}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rapport Détallé</Text>
            <View style={{ width: 44 }} />
          </View>

          {loadingReport ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#60a5fa" />
              <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 12 }}>Chargement des données...</Text>
            </View>
          ) : cycleReport ? (
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>CHIFFRE D'AFFAIRES</Text>
                    <Text style={[styles.summaryValue, { color: "#60a5fa" }]}>{cycleReport.totalRevenue?.toLocaleString("fr-FR")} FCFA</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>BÉNÉFICE NET</Text>
                    <Text style={[styles.summaryValue, { color: "#2ecc71" }]}>{cycleReport.netProfit?.toLocaleString("fr-FR")} FCFA</Text>
                  </View>
                </View>
                <View style={[styles.summaryRow, { marginTop: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", paddingTop: 20 }]}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>COMMANDES</Text>
                    <Text style={styles.summaryValue}>{cycleReport.orderCount || 0}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>DÉPENSES</Text>
                    <Text style={[styles.summaryValue, { color: "#ef4444" }]}>{cycleReport.totalExpenses?.toLocaleString("fr-FR")} FCFA</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.detailSectionTitle}>Ventes par produits</Text>
              <View style={styles.productSalesList}>
                {cycleReport.productSales?.map((ps: any, idx: number) => (
                  <View key={idx} style={styles.productSaleCard}>
                    <View style={styles.productSaleImage}>
                      {ps.productImageUrl ? (
                        <Image source={{ uri: formatImageUrl(ps.productImageUrl) }} style={{ width: "100%", height: "100%", borderRadius: 8 }} />
                      ) : (
                        <MaterialIcons name="fastfood" size={20} color="rgba(255,255,255,0.2)" />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.productSaleName}>{ps.productName}</Text>
                      <Text style={styles.productSaleQty}>{ps.quantity} vendus</Text>
                    </View>
                    <Text style={styles.productSalePrice}>{ps.revenue?.toLocaleString("fr-FR")} FCFA</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.detailSectionTitle}>Modes de paiement</Text>
              <View style={styles.paymentList}>
                {cycleReport.paymentBreakdown?.map((pm: any, idx: number) => (
                  <View key={idx} style={styles.paymentCard}>
                    <MaterialIcons name={pm.method === "CASH" ? "payments" : "smartphone"} size={24} color="#60a5fa" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.paymentMethod}>{pm.method === "CASH" ? "Espèces" : pm.method}</Text>
                      <Text style={styles.paymentCount}>{pm.count} transactions</Text>
                    </View>
                    <Text style={styles.paymentAmount}>{pm.total?.toLocaleString("fr-FR")} FCFA</Text>
                  </View>
                ))}
              </View>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  header: {
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "android" ? 60 : 30,
    paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)"
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  searchBarWrapper: { marginTop: 4 },
  searchBar: { 
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", 
    borderRadius: 12, paddingHorizontal: 12, height: 46, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" 
  },
  searchInput: { flex: 1, color: "#fff", marginLeft: 8, fontSize: 14, fontWeight: "600" },

  tabsContainer: { flexDirection: "row", padding: 20, paddingBottom: 0, gap: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "transparent" },
  activeTab: { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" },
  tabText: { color: "rgba(255,255,255,0.5)", fontWeight: "600", fontSize: 14 },
  activeTabText: { color: "#fff" },

  list: { padding: 20, gap: 16, paddingBottom: 40 },
  cycleCard: { backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 },
  cycleHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dateBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  cycleDay: { fontSize: 18, fontWeight: "900", color: "#fff" },
  cycleMonth: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.4)" },
  cycleDate: { fontSize: 16, fontWeight: "700", color: "#fff", textTransform: "capitalize", marginBottom: 2 },
  cycleTime: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  
  miniStats: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 12, gap: 12 },
  miniStatItem: { flex: 1 },
  miniStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "700", textTransform: "uppercase", marginBottom: 2 },
  miniStatValue: { fontSize: 13, fontWeight: "800" },

  statIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(96, 165, 250, 0.1)", alignItems: "center", justifyContent: "center" },
  reportContent: { gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  reportRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reportLabel: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  reportValue: { fontSize: 15, fontWeight: "800" },
  topProductsSection: { marginTop: 8 },
  sectionTitle: { color: "#fff", fontSize: 13, fontWeight: "800", marginBottom: 10, textTransform: "uppercase" },
  topProductItem: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12, marginBottom: 8 },
  topProductRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(96, 165, 250, 0.2)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  topProductRankText: { color: "#60a5fa", fontSize: 12, fontWeight: "800" },
  topProductImage: { width: 32, height: 32, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  topProductText: { color: "#fff", fontWeight: "700", fontSize: 14, marginBottom: 2 },
  topProductMeta: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  topProductRevenue: { color: "#fff", fontWeight: "800", fontSize: 14, marginLeft: 12 },

  noReportBox: { padding: 12, backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 12, marginTop: 8, alignItems: "center" },
  noReportText: { fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic" },

  emptyCard: { backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 40, alignItems: "center", marginTop: 20, borderStyle: "dashed" },
  emptyCardTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  emptyCardText: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 20 },

  calcCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  calcTitle: { color: "#fff", fontSize: 15, fontWeight: "800", marginBottom: 16 },
  inputRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  inputContainer: { flex: 1 },
  inputLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", marginBottom: 6, textTransform: "uppercase" },
  input: { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 12, color: "#fff", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", fontSize: 14 },
  calcBtn: { backgroundColor: "#fff", borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  calcBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },

  modalContainer: { flex: 1, backgroundColor: "#0c0c0c" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  modalCloseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  modalLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
  modalScroll: { padding: 20 },
  summaryCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.4)", marginBottom: 8 },
  summaryValue: { fontSize: 18, fontWeight: "900", color: "#fff" },

  detailSectionTitle: { fontSize: 14, fontWeight: "800", color: "#fff", textTransform: "uppercase", marginBottom: 16, marginTop: 12 },
  productSalesList: { gap: 12, marginBottom: 24 },
  productSaleCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 16 },
  productSaleImage: { width: 44, height: 44, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  productSaleName: { fontSize: 14, fontWeight: "700", color: "#fff" },
  productSaleQty: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  productSalePrice: { fontSize: 14, fontWeight: "800", color: "#fff" },

  paymentList: { gap: 12 },
  paymentCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 16 },
  paymentMethod: { fontSize: 14, fontWeight: "700", color: "#fff" },
  paymentCount: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  paymentAmount: { fontSize: 14, fontWeight: "800", color: "#60a5fa" },
});