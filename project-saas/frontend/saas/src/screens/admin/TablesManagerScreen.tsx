import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  Modal, TextInput, Alert, SafeAreaView, Switch, ScrollView, Platform, KeyboardAvoidingView, Linking, Share
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AdminStackParams } from "../../navigation";
import { TableApi, TableData } from "../../api";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { LoadingScreen } from "../../components/ui";

type Props = NativeStackScreenProps<AdminStackParams, "TablesManager">;

export function TablesManagerScreen({ navigation }: Props) {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);

  const [form, setForm] = useState({
    name: "", capacity: "4", isActive: true
  });

  const loadData = async () => {
    try {
      const data = await TableApi.list();
      setTables(data);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreateModal = () => {
    setEditingTable(null);
    setForm({ name: "", capacity: "4", isActive: true });
    setShowModal(true);
  };

  const openEditModal = (table: TableData) => {
    setEditingTable(table);
    setForm({
      name: table.name || "",
      capacity: table.capacity !== undefined ? String(table.capacity) : "4",
      isActive: table.isActive ?? true
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.capacity) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    try {
      const payload = {
        name: form.name,
        capacity: parseInt(form.capacity) || 4,
        isActive: form.isActive
      };
      if (editingTable) {
        await TableApi.update(editingTable.id, payload);
      } else {
        await TableApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert("Erreur", err.response?.data?.message || "Erreur de sauvegarde");
    }
  };

  const handleToggleActive = async (table: TableData) => {
    try {
      await TableApi.update(table.id, { isActive: !table.isActive });
      loadData();
    } catch (err) {
      Alert.alert("Erreur", "Impossible de modifier la table");
    }
  };

  const regenerateQr = async (id: string) => {
    Alert.alert("Régénérer le QR Code", "L'ancien code ne sera plus valide. Confirmer ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Confirmer", onPress: async () => {
        try {
          await TableApi.regenerateQr(id);
          loadData();
        } catch (err) {
          Alert.alert("Erreur", "Impossible de régénérer");
        }
      }}
    ]);
  };

  const getQrImageUrl = (scanUrl: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(scanUrl)}`;
  };

  const openQr = (url: string) => {
    const imageUrl = getQrImageUrl(url);
    Linking.openURL(imageUrl);
  };

  const downloadQr = async (url: string) => {
    const imageUrl = getQrImageUrl(url);
    try {
      await Share.share({
        title: "Partager le QR Code",
        url: imageUrl,
        message: `QR Code pour la table ${editingTable?.name || ""}: ${imageUrl}`,
      });
    } catch (err) {
      Alert.alert("Erreur", "Impossible de partager le QR code");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <LoadingScreen message="Chargement des tables..." />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => (navigation as any).openDrawer()}>
              <MaterialIcons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tables & QR Codes</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
              <MaterialIcons name="add" size={20} color="#000" />
              <Text style={styles.addBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={tables}
            keyExtractor={(t) => t.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <MaterialIcons name="table-restaurant" size={48} color="rgba(255,255,255,0.2)" style={{marginBottom: 16}} />
                <Text style={styles.emptyCardTitle}>Aucune table</Text>
                <Text style={styles.emptyCardText}>Ajoutez vos tables pour générer des QR codes</Text>
              </View>
            }
            renderItem={({ item: table }) => (
              <View style={styles.tableCard}>
                <View style={styles.tableLeft}>
                  <View style={styles.tableNameRow}>
                    <Text style={[styles.tableName, !table.isActive && styles.tableNameInactive]}>{table.name}</Text>
                    {table.activeOrder && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Occupée</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tableCapacity}>
                    <MaterialIcons name="people" size={14} color="rgba(255,255,255,0.5)" /> {table.capacity} personnes
                  </Text>

                  <View style={styles.qrActions}>
                    {table.qrUrl ? (
                      <>
                        <TouchableOpacity style={styles.qrBtn} onPress={() => openQr(table.qrUrl)}>
                          <MaterialIcons name="qr-code" size={16} color="#fff" />
                          <Text style={styles.qrBtnText}>Voir QR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.qrIconBtn} onPress={() => regenerateQr(table.id)}>
                          <MaterialIcons name="refresh" size={16} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={styles.noQrText}>Pas de QR code</Text>
                    )}
                  </View>
                </View>

                <View style={styles.tableRight}>
                  <Switch
                    value={table.isActive}
                    onValueChange={() => handleToggleActive(table)}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(46, 204, 113, 0.3)" }}
                    thumbColor={table.isActive ? "#2ecc71" : "#fff"}
                  />
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(table)}>
                    <MaterialIcons name="edit" size={18} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </>
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingTable ? "Modifier table" : "Nouvelle table"}</Text>
              <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
                <Text style={styles.modalSave}>Enregistrer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {editingTable && editingTable.qrUrl && (
                <View style={styles.qrPreviewSection}>
                  <Text style={styles.formLabel}>QR CODE DE LA TABLE</Text>
                  <View style={styles.qrPreviewCard}>
                    <Image source={{ uri: getQrImageUrl(editingTable.qrUrl) }} style={styles.qrImageLarge} />
                    <TouchableOpacity style={styles.downloadBtn} onPress={() => downloadQr(editingTable.qrUrl!)}>
                      <MaterialIcons name="share" size={20} color="#fff" />
                      <Text style={styles.downloadBtnText}>Télécharger / Partager</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Nom de la table *</Text>
                <TextInput
                  style={styles.formInput}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder="Ex: Table 1, Terrasse 2"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Capacité *</Text>
                <TextInput
                  style={styles.formInput}
                  value={form.capacity}
                  onChangeText={(v) => setForm((f) => ({ ...f, capacity: v }))}
                  placeholder="Ex: 4"
                  keyboardType="numeric"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              <View style={[styles.formField, styles.formFieldRow]}>
                <View>
                  <Text style={styles.formLabel}>Table active</Text>
                  <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Visible par les clients et la caisse</Text>
                </View>
                <Switch
                  value={form.isActive}
                  onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(46, 204, 113, 0.3)" }}
                  thumbColor={form.isActive ? "#2ecc71" : "#fff"}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "android" ? 60 : 30, // pushed down to avoid notch
    paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)"
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
  addBtnText: { color: "#000", fontSize: 13, fontWeight: "700" },

  list: { padding: 20, gap: 12, paddingBottom: 40 },
  tableCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16, padding: 16
  },
  tableLeft: { flex: 1, marginRight: 16 },
  tableNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  tableName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  tableNameInactive: { color: "rgba(255,255,255,0.3)", textDecorationLine: "line-through" },
  activeBadge: { backgroundColor: "rgba(231, 76, 60, 0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  activeBadgeText: { fontSize: 10, color: "#e74c3c", fontWeight: "700" },
  tableCapacity: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 },

  qrActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  qrBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(96, 165, 250, 0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 6 },
  qrBtnText: { color: "#60a5fa", fontSize: 12, fontWeight: "600" },
  qrIconBtn: { padding: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 6 },
  noQrText: { fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic" },

  tableRight: { alignItems: "flex-end", gap: 12 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },

  emptyCard: { backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 40, alignItems: "center", marginTop: 20, borderStyle: "dashed" },
  emptyCardTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  emptyCardText: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 20 },

  modalContainer: { flex: 1, backgroundColor: "#0c0c0c" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  modalCancelBtn: { padding: 4 },
  modalCancel: { color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: "500" },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  modalSaveBtn: { padding: 4 },
  modalSave: { color: "#60a5fa", fontSize: 15, fontWeight: "700" },
  modalContent: { padding: 20, gap: 20 },

  qrPreviewSection: { marginBottom: 20, alignItems: "center" },
  qrPreviewCard: { 
    backgroundColor: "#fff", padding: 20, borderRadius: 20, alignItems: "center", 
    width: "100%", marginTop: 12, borderBottomWidth: 4, borderBottomColor: "rgba(0,0,0,0.1)" 
  },
  qrImageLarge: { width: 200, height: 200, marginBottom: 20 },
  downloadBtn: { 
    flexDirection: "row", alignItems: "center", backgroundColor: "#000", 
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 
  },
  downloadBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  formField: { gap: 8 },
  formFieldRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  formLabel: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" },
  formInput: {
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: "#fff",
  },
});
