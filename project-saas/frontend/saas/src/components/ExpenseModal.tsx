// =============================================================
//  src/components/ExpenseModal.tsx
//  Modale réutilisable d'ajout de dépense — Premium UI
//  Peut être utilisée depuis TablesScreen ou CycleScreen
// =============================================================

import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, TouchableWithoutFeedback, Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { ExpenseApi, CycleApi } from "../api";

interface ExpenseModalProps {
  visible:   boolean;
  onClose:   () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: "SUPPLIES",    label: "Fournitures", icon: "box",         color: "#3498db" },
  { id: "MAINTENANCE", label: "Entretien",   icon: "tool",        color: "#e67e22" },
  { id: "RENT",        label: "Loyer",       icon: "home",        color: "#9b59b6" },
  { id: "SALARY",      label: "Salaires",    icon: "user",        color: "#2ecc71" },
  { id: "UTILITIES",   label: "Énergie/Eau", icon: "zap",         color: "#f1c40f" },
  { id: "MARKETING",   label: "Commercial",  icon: "target",      color: "#e74c3c" },
  { id: "EQUIPEMENT",  label: "Équipement",  icon: "coffee",      color: "#1abc9c" },
  { id: "OTHER",       label: "Autre",       icon: "plus-circle", color: "#95a5a6" },
];

export function ExpenseModal({ visible, onClose, onSuccess }: ExpenseModalProps) {
  const [cycle,    setCycle]    = useState<any>(null);
  const [amount,   setAmount]   = useState("");
  const [desc,     setDesc]     = useState("");
  const [category, setCategory] = useState("OTHER");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (visible) {
      CycleApi.getActive().then(setCycle).catch(() => setCycle(null));
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!cycle) {
      Alert.alert("Caisse fermée", "Vous devez ouvrir la caisse avant d'enregistrer une dépense.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Montant invalide", "Veuillez saisir un montant valide.");
      return;
    }

    try {
      setLoading(true);
      await ExpenseApi.create({
        cycleId: cycle.id,
        amount: parseFloat(amount),
        description: desc,
        category,
      });
      // Reset form
      setAmount("");
      setDesc("");
      setCategory("OTHER");
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert("Erreur", e.response?.data?.message ?? "Impossible d'enregistrer la dépense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View entering={SlideInDown.duration(400).springify()} exiting={SlideOutDown.duration(300)} style={styles.content}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Handle bar */}
                <View style={styles.handleBar} />

                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerIconBox}>
                    <Icon name="dollar-sign" size={24} color="#FF6B00" />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>Nouvelle Dépense</Text>
                    <Text style={styles.headerSub}>
                      {cycle ? "Enregistrer une sortie de caisse" : "⚠️ Caisse fermée"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Icon name="x" size={20} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>

                {/* Amount */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Montant (FCFA)</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>

                {/* Category */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Catégorie</Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORIES.map((cat) => {
                      const isActive = category === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryChip,
                            isActive && { backgroundColor: `${cat.color}20`, borderColor: cat.color },
                          ]}
                          onPress={() => setCategory(cat.id)}
                        >
                          <Icon name={cat.icon} size={14} color={isActive ? cat.color : "rgba(255,255,255,0.4)"} />
                          <Text style={[styles.categoryChipText, isActive && { color: cat.color }]}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description (optionnel)</Text>
                  <TextInput
                    style={styles.descInput}
                    value={desc}
                    onChangeText={setDesc}
                    multiline
                    placeholder="Ex: Achat de serviettes..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>

                {/* Submit */}
                <TouchableOpacity
                  style={[styles.submitBtn, (!cycle || loading) && { opacity: 0.5 }]}
                  onPress={handleSubmit}
                  disabled={!cycle || loading}
                >
                  <Icon name="check" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    {loading ? "Enregistrement..." : "Enregistrer la dépense"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  content: {
    backgroundColor: "#1a1a1e", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: "85%",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
  },
  handleBar: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center", marginBottom: 20,
  },

  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 28 },
  headerIconBox: {
    width: 52, height: 52, borderRadius: 18, backgroundColor: "rgba(255,107,0,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "600", marginTop: 2 },
  closeBtn: { marginLeft: "auto", padding: 8 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.5)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },

  amountInput: {
    backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)", padding: 20,
    fontSize: 28, fontWeight: "800", color: "#fff", textAlign: "center",
  },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  categoryChipText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.5)" },

  descInput: {
    backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 16, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)", padding: 16, minHeight: 80,
    fontSize: 15, color: "#fff", textAlignVertical: "top",
  },

  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#FF6B00", paddingVertical: 18, borderRadius: 18, marginTop: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
