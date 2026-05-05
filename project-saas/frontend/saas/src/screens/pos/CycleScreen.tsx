// =============================================================
//  src/screens/pos/CycleScreen.tsx
//  Ouverture et fermeture de caisse (Premium UI)
// =============================================================

import React, { useEffect, useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, Modal } from "react-native";
import { CycleApi, ExpenseApi, StaffApi, UploadApi } from "../../api";
import { usePosStore as usePosStoreInner } from "../../store/pos.store";
import { Button } from "../../components/ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { layout, spacing } from "../../theme";
import { PosStackParams } from "../../navigation";
import Icon from "react-native-vector-icons/Feather";
import Animated, { FadeInDown, FadeInUp, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { ConfirmActionModal } from "../../components/ConfirmActionModal";

type CycleProps = NativeStackScreenProps<PosStackParams, "Cycle">;

const CATEGORIES = [
  { id: "SUPPLIES",    label: "Fournitures", icon: "box",        color: "#3498db" },
  { id: "MAINTENANCE", label: "Entretien",   icon: "tool",       color: "#e67e22" },
  { id: "RENT",        label: "Loyer",       icon: "home",       color: "#9b59b6" },
  { id: "SALARY",      label: "Salaires",    icon: "user",       color: "#2ecc71" },
  { id: "UTILITIES",   label: "Énergie/Eau", icon: "zap",        color: "#f1c40f" },
  { id: "MARKETING",   label: "Commercial",  icon: "target",     color: "#e74c3c" },
  { id: "EQUIPEMENT",  label: "Équipement",  icon: "coffee",     color: "#1abc9c" },
  { id: "OTHER",       label: "Autre",       icon: "plus-circle", color: "#95a5a6" },
];

export function CycleScreen({ navigation }: CycleProps) {
  const [activeCycle,  setActiveCycle]  = useState<any | null>(null);
  const [hasStaff,     setHasStaff]     = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [cash,         setCash]         = useState("");
  const [notes,        setNotes]        = useState("");
  const [working,      setWorking]      = useState(false);
  
  const [expenses,     setExpenses]     = useState<any[]>([]);
  const [showExpense,  setShowExpense]  = useState(false);
  
  // Expense Form Data
  const [expAmount,    setExpAmount]    = useState("");
  const [expDesc,      setExpDesc]      = useState("");
  const [expCategory,  setExpCategory]  = useState("OTHER");
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const setActiveCycleId = usePosStoreInner((s) => s.setActiveCycle);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const [c, staff] = await Promise.all([
        CycleApi.getActive(),
        StaffApi.list()
      ]);
      setActiveCycle(c);
      setHasStaff(Array.isArray(staff) && staff.length > 0);
      if (c && c.status === "OPEN") {
        setCash(c.expectedCash?.toString() || "");
        loadExpenses(c.id);
      }
    } catch (e) {
      console.error(e);
      setHasStaff(false);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async (cycleId: string) => {
    try {
      const data = await ExpenseApi.list(cycleId);
      setExpenses(data || []);
    } catch (e) {}
  };

  const handleOpen = async () => {
    try {
      setWorking(true);
      const cycle = await CycleApi.open(parseFloat(cash) || 0);
      setActiveCycle(cycle);
      setActiveCycleId(cycle.id);
      setCash(cycle.expectedCash?.toString() || "");
      Alert.alert("✓ Caisse ouverte", "Bonne journée !");
    } catch (e: any) {
      Alert.alert("Erreur", e.response?.data?.message ?? "Impossible d'ouvrir la caisse");
    } finally {
      setWorking(false);
    }
  };

  const handleClose = async () => {
    if (!activeCycle) return;
    setShowConfirmClose(true);
  };

  const confirmClose = async () => {
    setShowConfirmClose(false);
    try {
      setWorking(true);
      const result = await CycleApi.close(activeCycle.id, parseFloat(cash) || 0, notes);
      setActiveCycle(null);
      setActiveCycleId(null);
      const r = result.report;
      Alert.alert(
        "Caisse fermée",
        `CA : ${r?.totalRevenu?.toLocaleString("fr-FR") ?? 0} FCFA`
      );
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Erreur", e.response?.data?.message ?? "Impossible de fermer");
    } finally {
      setWorking(false);
    }
  };

  const handleAddExpense = async () => {
    if (!activeCycle || !expAmount) return;
    try {
      setWorking(true);
      await ExpenseApi.create({
        cycleId: activeCycle.id,
        amount: parseFloat(expAmount),
        description: expDesc,
        category: expCategory,
      });
      setShowExpense(false);
      setExpAmount("");
      setExpDesc("");
      setExpCategory("OTHER");
      loadExpenses(activeCycle.id);
      Alert.alert("Succès", "Dépense enregistrée");
    } catch (e: any) {
      Alert.alert("Erreur", "Impossible d'enregistrer la dépense");
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={{ color: "#fff" }}>Chargement...</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Background Elements */}
      <View style={[styles.bgBlob, { top: -100, right: -100, backgroundColor: activeCycle ? 'rgba(46,204,113,0.15)' : 'rgba(255,71,87,0.15)' }]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#FF6B00" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion de la Caisse</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {!activeCycle && !hasStaff ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.warningCard}>
            <View style={styles.warningIconBox}>
              <Icon name="users" size={32} color="#f39c12" />
            </View>
            <Text style={styles.warningTitle}>Personnel Requis</Text>
            <Text style={styles.warningDesc}>
              Vous devez créer au moins un membre du personnel avant d'ouvrir la caisse.
            </Text>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(400)} style={[styles.statusCard, activeCycle ? styles.statusCardOpen : styles.statusCardClosed]}>
              <View style={[styles.statusIconBox, activeCycle ? styles.statusIconBoxOpen : styles.statusIconBoxClosed]}>
                <Icon name={activeCycle ? "unlock" : "lock"} size={32} color={activeCycle ? "#2ecc71" : "#ff4757"} />
              </View>
              <Text style={[styles.statusTitle, activeCycle ? { color: "#2ecc71" } : { color: "#ff4757" }]}>
                {activeCycle ? "Caisse Ouverte" : "Caisse Fermée"}
              </Text>
              {activeCycle && (
                <Text style={styles.statusSub}>
                  Ouverte à {new Date(activeCycle.openedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.inputCard}>
              <View style={styles.inputCardHeader}>
                <Icon name="dollar-sign" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={styles.inputCardTitle}>
                  {activeCycle ? "Montant physique en caisse" : "Fond de caisse initial"}
                </Text>
              </View>
              <TextInput
                style={styles.amountInput}
                value={cash}
                onChangeText={setCash}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              {activeCycle && (
                <Text style={styles.expectedCashText}>
                  Théorique : {activeCycle.expectedCash?.toLocaleString("fr-FR")} FCFA
                </Text>
              )}
            </Animated.View>

            {activeCycle && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.inputCard}>
                <View style={styles.inputCardHeader}>
                  <Icon name="file-text" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.inputCardTitle}>Notes de clôture (optionnel)</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Écarts de caisse, incidents..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <Button
                label={activeCycle ? "Clôturer la Caisse" : "Ouvrir la Caisse"}
                onPress={activeCycle ? handleClose : handleOpen}
                loading={working}
                variant={activeCycle ? "danger" : "primary"}
                fullWidth
                size="lg"
                style={{ borderRadius: 16 }}
              />
            </Animated.View>

            {activeCycle && (
              <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.expensesSection}>
                <View style={styles.expensesHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon name="archive" size={18} color="#FF6B00" />
                    <Text style={styles.expensesTitle}>Dépenses de la session</Text>
                  </View>
                  <TouchableOpacity style={styles.addExpenseBtn} onPress={() => setShowExpense(true)}>
                    <Icon name="plus" size={14} color="#FF6B00" />
                    <Text style={styles.addExpenseText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>

                {expenses.length === 0 ? (
                  <View style={styles.emptyExpenses}>
                    <Text style={styles.emptyExpensesText}>Aucune dépense enregistrée</Text>
                  </View>
                ) : (
                  expenses.map(exp => {
                    const cfg = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[7];
                    return (
                      <View key={exp.id} style={styles.expenseItem}>
                        <View style={[styles.expenseIconBox, { backgroundColor: `${cfg.color}20` }]}>
                          <Icon name={cfg.icon} size={20} color={cfg.color} />
                        </View>
                        <View style={styles.expenseDetails}>
                          <Text style={styles.expenseDesc} numberOfLines={1}>{exp.description}</Text>
                          <Text style={styles.expenseCat}>{cfg.label}</Text>
                        </View>
                        <View style={styles.expenseAmounts}>
                          <Text style={styles.expenseAmt}>-{exp.amount.toLocaleString("fr-FR")} F</Text>
                          <Text style={styles.expenseTime}>
                            {new Date(exp.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      {/* Expense Modal (Bottom Sheet Style) */}
      <Modal visible={showExpense} transparent animationType="none" onRequestClose={() => setShowExpense(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowExpense(false)} />
          <Animated.View entering={SlideInDown.duration(300)} exiting={SlideOutDown.duration(300)} style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Nouvelle Dépense</Text>
              <TouchableOpacity onPress={() => setShowExpense(false)} style={styles.closeBtn}>
                <Icon name="x" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={styles.sheetLabelCenter}>MONTANT (FCFA)</Text>
              <TextInput
                style={styles.sheetAmountInput}
                value={expAmount}
                onChangeText={setExpAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />

              <Text style={styles.sheetLabel}><Icon name="tag" /> Catégorie</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map(c => {
                  const isSelected = expCategory === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catBtn, isSelected && { borderColor: c.color, backgroundColor: `${c.color}15` }]}
                      onPress={() => setExpCategory(c.id)}
                    >
                      <View style={[styles.catIconBox, { backgroundColor: isSelected ? c.color : "rgba(255,255,255,0.06)" }]}>
                        <Icon name={c.icon} size={18} color={isSelected ? "#fff" : "rgba(255,255,255,0.6)"} />
                      </View>
                      <Text style={[styles.catLabel, isSelected && { color: c.color }]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sheetLabel}>Description</Text>
              <TextInput
                style={styles.sheetDescInput}
                value={expDesc}
                onChangeText={setExpDesc}
                placeholder="Détails de la dépense..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
              />

              <Button
                label="Enregistrer la dépense"
                onPress={handleAddExpense}
                loading={working}
                disabled={!expAmount}
                fullWidth
                size="lg"
                style={{ marginTop: 24, borderRadius: 16 }}
              />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121214", position: "relative" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  bgBlob: { position: 'absolute', width: 250, height: 250, borderRadius: 125, filter: [{ blur: 60 }], zIndex: 0 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)", paddingHorizontal: layout.screenPadding,
    paddingTop: Platform.OS === "android" ? 60 : spacing.lg, paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", zIndex: 1,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: "#FF6B00", fontSize: 15, fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff", flex: 1, textAlign: "center" },
  content: { padding: layout.screenPadding, gap: 24, flexGrow: 1, zIndex: 1, paddingBottom: 60 },

  warningCard: { backgroundColor: "rgba(243,156,18,0.1)", borderWidth: 1, borderColor: "rgba(243,156,18,0.2)", borderRadius: 24, padding: 32, alignItems: "center" },
  warningIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(243,156,18,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  warningTitle: { color: "#f39c12", fontSize: 22, fontWeight: "800", marginBottom: 12 },
  warningDesc: { color: "rgba(255,255,255,0.7)", fontSize: 15, textAlign: "center", lineHeight: 22 },

  statusCard: { borderWidth: 1, borderRadius: 24, padding: 32, alignItems: "center" },
  statusCardOpen: { backgroundColor: "rgba(46,204,113,0.1)", borderColor: "rgba(46,204,113,0.2)" },
  statusCardClosed: { backgroundColor: "rgba(255,71,87,0.1)", borderColor: "rgba(255,71,87,0.2)" },
  statusIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  statusIconBoxOpen: { backgroundColor: "rgba(46,204,113,0.2)" },
  statusIconBoxClosed: { backgroundColor: "rgba(255,71,87,0.2)" },
  statusTitle: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  statusSub: { color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "500" },

  inputCard: { backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 24 },
  inputCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  inputCardTitle: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "700" },
  amountInput: { backgroundColor: "rgba(0,0,0,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, fontSize: 32, fontWeight: "800", color: "#fff", textAlign: "center" },
  expectedCashText: { color: "#FF6B00", fontSize: 13, fontWeight: "800", textAlign: "center", marginTop: 12, backgroundColor: "rgba(255,255,255,0.05)", paddingVertical: 6, borderRadius: 10, overflow: "hidden" },
  notesInput: { backgroundColor: "rgba(0,0,0,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, fontSize: 15, color: "#fff", minHeight: 100, textAlignVertical: "top" },

  expensesSection: { marginTop: 12 },
  expensesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  expensesTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  addExpenseBtn: { backgroundColor: "rgba(255,107,0,0.1)", flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  addExpenseText: { color: "#FF6B00", fontSize: 12, fontWeight: "800" },
  emptyExpenses: { backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "dashed", borderRadius: 16, padding: 24, alignItems: "center" },
  emptyExpensesText: { color: "rgba(255,255,255,0.3)", fontSize: 13 },
  
  expenseItem: { backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  expenseIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  expenseDetails: { flex: 1 },
  expenseDesc: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  expenseCat: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "600" },
  expenseAmounts: { alignItems: "flex-end" },
  expenseAmt: { color: "#ff4757", fontSize: 15, fontWeight: "800" },
  expenseTime: { color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  bottomSheet: { backgroundColor: "#1a1a1e", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24, maxHeight: "90%" },
  sheetHandle: { width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, alignSelf: "center", marginTop: 12 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center" },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 20 },
  sheetLabelCenter: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 10 },
  sheetAmountInput: { backgroundColor: "transparent", fontSize: 42, fontWeight: "900", color: "#fff", textAlign: "center", paddingVertical: 10, marginBottom: 24 },
  sheetLabel: { fontSize: 13, fontWeight: "800", color: "rgba(255,255,255,0.6)", marginBottom: 12, flexDirection: "row", alignItems: "center" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 24 },
  catBtn: { width: "25%", padding: 4, alignItems: "center", borderWidth: 2, borderColor: "transparent", borderRadius: 16 },
  catIconBox: { width: 34, height: 34, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  catLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.4)", textAlign: "center" },
  sheetDescInput: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 2, borderColor: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, color: "#fff", fontSize: 14, minHeight: 80, textAlignVertical: "top" },
});