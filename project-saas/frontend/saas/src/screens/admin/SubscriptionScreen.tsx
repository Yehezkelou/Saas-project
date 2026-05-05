// =============================================================
//  src/screens/admin/SubscriptionScreen.tsx
// =============================================================

import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Platform
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AdminStackParams } from "../../navigation";
import { SubscriptionApi } from "../../api";
import { LoadingScreen } from "../../components/ui";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { colors, typography, radius, spacing } from "../../theme";

type Props = NativeStackScreenProps<AdminStackParams, "Subscription">;

const PLAN_THEMES: Record<string, { bg: string; text: string; border: string; buttonBg: string; buttonText: string }> = {
  FREE:     { bg: "rgba(255,255,255,0.02)", text: "#FFFFFF", border: "rgba(255,255,255,0.1)", buttonBg: "#FFFFFF", buttonText: "#000000" },
  PRO:      { bg: "rgba(96, 165, 250, 0.1)", text: "#FFFFFF", border: "#60a5fa", buttonBg: "#60a5fa", buttonText: "#FFFFFF" },
  BUSINESS: { bg: "rgba(255, 255, 255, 0.05)", text: "#FFFFFF", border: "rgba(255,255,255,0.3)", buttonBg: "#FFFFFF", buttonText: "#000000" },
};

const PLAN_FEATURES: Record<string, string[]> = {
  FREE:     ["100 commandes/mois", "2 employés", "20 produits", "3 tables", "Rapports 7 jours"],
  PRO:      ["Commandes illimitées", "10 employés", "100 produits", "20 tables", "Rapports 90 jours", "Notifications"],
  BUSINESS: ["Tout illimité", "Staff illimité", "Produits illimités", "Tables illimitées", "Rapports 365 jours", "Notifications + push"],
};

const USAGE_LABELS: Record<string, string> = {
  staff:           "Employés",
  products:        "Produits actifs",
  tables:          "Tables",
  categories:      "Catégories",
  ordersThisMonth: "Commandes ce mois",
};

export function SubscriptionScreen({ navigation }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const loadData = () => {
    setLoading(true);
    SubscriptionApi.get()
      .then(setData)
      .catch(() => Alert.alert("Erreur", "Impossible de charger l'abonnement"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpgrade = (plan: string) => {
    Alert.alert(
      `Passer au plan ${plan}`,
      `Voulez-vous vraiment demander le passage au plan ${plan} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              setUpgrading(true);
              await SubscriptionApi.changePlan(plan);
              Alert.alert("Succès", `Demande envoyée pour le plan ${plan}. L'administrateur système doit la valider.`);
              loadData();
            } catch (err: any) {
              Alert.alert("Erreur", err.response?.data?.message || "Erreur lors du changement de plan");
            } finally {
              setUpgrading(false);
            }
          }
        }
      ]
    );
  };

  if (loading && !data) return <LoadingScreen message="Chargement de votre abonnement..." />;

  const sub = data?.subscription;
  const currentPlan = sub?.plan || "FREE";
  const daysLeft = data?.daysLeft ?? 0;
  const isExpiring = data?.isExpiringSoon;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Premium */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => (navigation as any).openDrawer()}>
            <MaterialIcons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestion d'abonnement</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
            <MaterialIcons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusLabel}>VOTRE OFFRE</Text>
              <Text style={styles.statusPlanName}>{currentPlan}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: sub?.status === "ACTIVE" ? "rgba(74, 222, 128, 0.1)" : "rgba(245, 158, 11, 0.1)" }]}>
              <View style={[styles.statusDot, { backgroundColor: sub?.status === "ACTIVE" ? "#4ade80" : "#f59e0b" }]} />
              <Text style={[styles.statusBadgeText, { color: sub?.status === "ACTIVE" ? "#4ade80" : "#f59e0b" }]}>
                {sub?.status === "ACTIVE" ? "Actif" : sub?.status}
              </Text>
            </View>
          </View>

          <View style={styles.statusFooter}>
            <MaterialIcons name="event" size={16} color="rgba(255,255,255,0.4)" />
            <Text style={styles.statusDateText}>
              {isExpiring 
                ? `Expire dans ${daysLeft} jours` 
                : `Renouvellement le ${new Date(sub?.expiresAt).toLocaleDateString("fr-FR")}`}
            </Text>
          </View>
          
          {isExpiring && (
            <View style={styles.expirationWarning}>
              <MaterialIcons name="warning" size={14} color="#fca5a5" />
              <Text style={styles.warningText}>Action requise : Renouvellement nécessaire</Text>
            </View>
          )}
        </View>

        {/* Quotas & Usage */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Utilisation des ressources</Text>
          <MaterialIcons name="insights" size={20} color="#60a5fa" />
        </View>

        <View style={styles.usageGrid}>
          {data?.usage && Object.entries(data.usage).map(([key, val]: any) => {
            if (!USAGE_LABELS[key]) return null;
            const isUnlimited = val.limits === -1 || val.limits === null;
            const current = val.current || 0;
            const limit = val.limits || 0;
            const pct = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
            
            return (
              <View key={key} style={styles.usageCard}>
                <View style={styles.usageTop}>
                  <Text style={styles.usageName}>{USAGE_LABELS[key]}</Text>
                  <Text style={styles.usageValue}>
                    {current}
                    <Text style={styles.usageLimitText}>/{isUnlimited ? "∞" : limit}</Text>
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: isUnlimited ? "100%" : `${pct}%`, 
                    backgroundColor: isUnlimited ? "rgba(255,255,255,0.1)" : (pct > 90 ? "#ef4444" : "#60a5fa") 
                  }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Upgrade Plans */}
        <Text style={styles.sectionTitle}>Changer de forfait</Text>
        <Text style={styles.sectionSubtitle}>Choisissez le plan adapté à la croissance de votre entreprise</Text>

        <View style={styles.plansList}>
          {(["FREE", "PRO", "BUSINESS"] as const).map((plan) => {
            const theme = PLAN_THEMES[plan];
            const isCurrent = currentPlan === plan;
            
            return (
              <View 
                key={plan} 
                style={[
                  styles.planCard, 
                  isCurrent && { borderColor: "#60a5fa", borderWidth: 2, backgroundColor: "rgba(96, 165, 250, 0.05)" }
                ]}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planTitle, isCurrent && { color: "#60a5fa" }]}>{plan}</Text>
                  {isCurrent && (
                    <View style={styles.currentIndicator}>
                      <Text style={styles.currentIndicatorText}>OFFRE ACTUELLE</Text>
                    </View>
                  )}
                </View>

                <View style={styles.featureGrid}>
                  {PLAN_FEATURES[plan].map((feature, i) => (
                    <View key={i} style={styles.featureRow}>
                      <MaterialIcons name="check-circle" size={18} color={isCurrent ? "#60a5fa" : "rgba(255,255,255,0.2)"} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {!isCurrent && (
                  <TouchableOpacity 
                    style={styles.upgradeButton} 
                    onPress={() => handleUpgrade(plan)}
                    disabled={upgrading}
                  >
                    <Text style={styles.upgradeButtonText}>
                      {plan === "BUSINESS" || (plan === "PRO" && currentPlan === "FREE") ? "Passer à ce forfait" : "Changer"}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#000" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  header: {
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "android" ? 60 : 30, // Fixed: lowered to avoid notch
    paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)"
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  content: { padding: 20 },

  statusCard: {
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 24, padding: 24, marginBottom: 32,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)"
  },
  statusHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  statusLabel: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.4)", letterSpacing: 1, marginBottom: 4 },
  statusPlanName: { fontSize: 32, fontWeight: "900", color: "#fff" },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  statusFooter: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDateText: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  expirationWarning: { 
    marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)",
    flexDirection: "row", alignItems: "center", gap: 8 
  },
  warningText: { color: "#fca5a5", fontSize: 12, fontWeight: "600" },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#fff" },
  sectionSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24, lineHeight: 20 },

  usageGrid: { marginBottom: 32 },
  usageCard: { 
    backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)"
  },
  usageTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  usageName: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
  usageValue: { fontSize: 16, fontWeight: "800", color: "#fff" },
  usageLimitText: { color: "rgba(255,255,255,0.2)", fontSize: 13 },
  progressBar: { height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },

  plansList: { gap: 16 },
  planCard: { 
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)"
  },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  planTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },
  currentIndicator: { backgroundColor: "rgba(96, 165, 250, 0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currentIndicatorText: { color: "#60a5fa", fontSize: 10, fontWeight: "800" },
  featureGrid: { gap: 12, marginBottom: 24 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureText: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  upgradeButton: { 
    backgroundColor: "#fff", borderRadius: 16, paddingVertical: 16, 
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 
  },
  upgradeButtonText: { color: "#000", fontSize: 15, fontWeight: "800" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "rgba(255,255,255,0.5)", fontSize: 16 },
});

