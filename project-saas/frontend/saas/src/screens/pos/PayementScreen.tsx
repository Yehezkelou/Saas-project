// =============================================================
//  src/screens/pos/PaymentScreen.tsx
//  Encaissement — Cash / Carte / Mobile Money
//  Calcul automatique du rendu monnaie pour le cash (Premium UI)
// =============================================================

import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, SafeAreaView, ScrollView, Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PosStackParams } from "../../navigation";
import { PaymentApi } from "../../api";
import { Button } from "../../components/ui";
import { typography, spacing, radius, layout } from "../../theme";
import Icon from "react-native-vector-icons/Feather";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";

type Props = NativeStackScreenProps<PosStackParams, "Payment">;
type Method = "CASH" | "CARD" | "MOBILE_MONEY";

const METHOD_CONFIG: Record<Method, { label: string; icon: string; color: string }> = {
  CASH:         { label: "Espèces",     icon: "dollar-sign", color: "#2ECC71" },
  CARD:         { label: "Carte",       icon: "credit-card", color: "#3498DB" },
  MOBILE_MONEY: { label: "Mobile Money", icon: "smartphone",  color: "#F39C12" },
};

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export function PaymentScreen({ navigation, route }: Props) {
  const { orderId, tableName, totalAmount } = route.params;

  const [method,       setMethod]       = useState<Method>("CASH");
  const [amountGiven,  setAmountGiven]  = useState("");
  const [reference,    setReference]    = useState("");
  const [processing,   setProcessing]   = useState(false);

  const amountGivenNum = parseFloat(amountGiven) || 0;
  const change = amountGivenNum - totalAmount;
  const hasEnough = amountGivenNum >= totalAmount;

  const handlePayment = async () => {
    if (method === "CASH" && !hasEnough) {
      Alert.alert("Montant insuffisant", `Il manque ${(totalAmount - amountGivenNum).toLocaleString("fr-FR")} FCFA`);
      return;
    }

    try {
      setProcessing(true);
      await PaymentApi.pay(orderId, method, totalAmount);

      Alert.alert(
        "✓ Paiement encaissé",
        method === "CASH" && change > 0
          ? `Rendu monnaie : ${change.toLocaleString("fr-FR")} FCFA`
          : "Paiement enregistré avec succès",
        [{ text: "OK", onPress: () => navigation.popToTop() }]
      );
    } catch (error: any) {
      Alert.alert("Erreur", error.response?.data?.message ?? "Paiement impossible");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Background Elements */}
      <View style={[styles.bgBlob, { top: -100, left: -100, backgroundColor: 'rgba(255,107,0,0.15)' }]} />
      <View style={[styles.bgBlob, { bottom: -100, right: -100, backgroundColor: 'rgba(46,204,113,0.1)' }]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#FF6B00" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Encaissement — {tableName}</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Total Box */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.totalBox}>
          <Text style={styles.totalLabel}>TOTAL À ENCAISSER</Text>
          <Text style={styles.totalAmount}>{totalAmount.toLocaleString("fr-FR")} FCFA</Text>
        </Animated.View>

        {/* Method Selection */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>Méthode de paiement</Text>
          <View style={styles.methodRow}>
            {(Object.entries(METHOD_CONFIG) as [Method, typeof METHOD_CONFIG[Method]][]).map(([key, cfg]) => {
              const isActive = method === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.methodCard,
                    isActive && { borderColor: cfg.color, backgroundColor: `${cfg.color}15` }
                  ]}
                  onPress={() => { setMethod(key); setAmountGiven(""); setReference(""); }}
                  activeOpacity={0.7}
                >
                  <Icon name={cfg.icon} size={28} color={isActive ? cfg.color : "rgba(255,255,255,0.6)"} style={{ marginBottom: 12 }} />
                  <Text style={[styles.methodLabel, isActive && { color: cfg.color, fontWeight: "bold" }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Dynamic Inputs Section */}
        <Animated.View layout={Layout.springify()} entering={FadeInUp.delay(200).duration(400)}>
          {method === "CASH" && (
            <View style={styles.inputSection}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.amountInput}
                  value={amountGiven}
                  onChangeText={setAmountGiven}
                  keyboardType="numeric"
                  placeholder="Montant remis (Ex: 10000)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              <View style={styles.quickAmounts}>
                {QUICK_AMOUNTS.map((amt) => {
                  const isSelected = amountGivenNum === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.quickBtn, isSelected && styles.quickBtnActive]}
                      onPress={() => setAmountGiven(String(amt))}
                    >
                      <Text style={[styles.quickBtnText, isSelected && styles.quickBtnTextActive]}>
                        {amt >= 1000 ? `${amt / 1000}k` : amt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {amountGivenNum > 0 && (
                <Animated.View entering={FadeInDown.duration(300)} style={[styles.changeBox, hasEnough ? styles.changeBoxOk : styles.changeBoxError]}>
                  <Text style={[styles.changeLabel, { color: hasEnough ? "#2ecc71" : "#e74c3c" }]}>
                    {hasEnough ? "Rendu monnaie" : "Manque"}
                  </Text>
                  <Text style={[styles.changeAmount, { color: hasEnough ? "#2ecc71" : "#e74c3c" }]}>
                    {Math.abs(change).toLocaleString("fr-FR")} FCFA
                  </Text>
                </Animated.View>
              )}
            </View>
          )}

          {method === "MOBILE_MONEY" && (
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Référence de la transaction</Text>
              <TextInput
                style={styles.refInput}
                value={reference}
                onChangeText={setReference}
                placeholder="Ex: Wave - TXN123456"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={{ marginTop: "auto", paddingTop: spacing.xl }}>
          <Button
            label={processing ? "Traitement..." : `Valider ${totalAmount.toLocaleString("fr-FR")} FCFA`}
            onPress={handlePayment}
            loading={processing}
            disabled={method === "CASH" && amountGivenNum > 0 && !hasEnough}
            fullWidth
            size="lg"
            style={{ borderRadius: 20, height: 60 }}
          />
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121214", position: "relative" },
  bgBlob: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    filter: [{ blur: 60 }], zIndex: 0,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)", paddingHorizontal: layout.screenPadding,
    paddingTop: Platform.OS === "android" ? 60 : spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
    zIndex: 1,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: "#FF6B00", fontSize: 15, fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", flex: 1, textAlign: "center" },

  content: { padding: layout.screenPadding, gap: 32, flexGrow: 1, zIndex: 1 },

  totalBox: {
    backgroundColor: "rgba(255,107,0,0.1)", borderRadius: 24,
    borderWidth: 1, borderColor: "rgba(255,107,0,0.2)",
    padding: 32, alignItems: "center",
  },
  totalLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8, fontWeight: "700", letterSpacing: 1 },
  totalAmount: { fontSize: 42, fontWeight: "800", color: "#FF6B00", letterSpacing: -1 },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginBottom: 16 },

  methodRow: { flexDirection: "row", gap: 12 },
  methodCard: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 20,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.05)",
    paddingVertical: 20, paddingHorizontal: 8, alignItems: "center",
  },
  methodLabel: { fontSize: 13, color: "rgba(255,255,255,0.6)", textAlign: "center", fontWeight: "600" },

  inputSection: { gap: 16 },
  inputContainer: { position: "relative" },
  amountInput: {
    backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    padding: 20, fontSize: 24, fontWeight: "700", color: "#fff",
    textAlign: "center",
  },

  quickAmounts: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickBtn: {
    flexBasis: "31%", flexGrow: 1, paddingVertical: 14,
    borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center",
  },
  quickBtnActive: { backgroundColor: "#FF6B00" },
  quickBtnText: { fontSize: 15, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  quickBtnTextActive: { color: "#fff" },

  changeBox: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderRadius: 16, padding: 20, borderWidth: 1, marginTop: 8,
  },
  changeBoxOk:    { backgroundColor: "rgba(46,204,113,0.1)", borderColor: "rgba(46,204,113,0.3)" },
  changeBoxError: { backgroundColor: "rgba(231,76,60,0.1)", borderColor: "rgba(231,76,60,0.3)" },
  changeLabel: { fontSize: 15, fontWeight: "700" },
  changeAmount: { fontSize: 24, fontWeight: "800", letterSpacing: -1 },

  refInput: {
    backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    padding: 20, fontSize: 16, color: "#fff",
  },
});