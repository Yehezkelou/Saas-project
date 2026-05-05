import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, SafeAreaView, ScrollView, Platform, KeyboardAvoidingView
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AdminStackParams } from "../../navigation";
import { StaffApi, Staff } from "../../api";
import { apiPost, apiGet, apiDelete, apiPut } from "../../api/client";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { LoadingScreen } from "../../components/ui";

type StaffProps = NativeStackScreenProps<AdminStackParams, "Staff">;

export function StaffScreen({ navigation }: StaffProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roles,     setRoles]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [form, setForm] = useState({ 
    name: "", pin: "", roleId: "", identifier: "" 
  });

  const loadData = async () => {
    try {
      const [staff, roleData] = await Promise.all([
        StaffApi.list(),
        apiGet<any[]>("/roles"),
      ]);
      setStaffList(staff);
      setRoles(roleData);
      if (roleData.length > 0 && !form.roleId) setForm((f) => ({ ...f, roleId: roleData[0].id }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreateModal = () => {
    setEditingStaff(null);
    setForm({ name: "", pin: "", roleId: roles[0]?.id ?? "", identifier: "" });
    setShowModal(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setForm({
      name: staff.name,
      pin: "", // On ne montre pas le PIN actuel pour sécurité
      roleId: staff.role.id,
      identifier: staff.identifier
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.roleId || (!editingStaff && form.pin.length !== 4)) {
      Alert.alert("Erreur", "Veuillez remplir les champs obligatoires (Nom, Rôle, et PIN pour les nouveaux).");
      return;
    }
    try {
      const payload: any = {
        name: form.name,
        roleId: form.roleId,
        identifier: form.identifier
      };
      if (form.pin) payload.pin = form.pin;

      if (editingStaff) {
        await apiPut(`/staff/${editingStaff.id}`, payload);
      } else {
        await apiPost("/staff", payload);
      }
      
      setShowModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Erreur", error.response?.data?.message ?? "Action impossible");
    }
  };

  const handleDelete = (staff: Staff) => {
    Alert.alert(
      `Supprimer ${staff.name} ?`,
      "Cet employé sera définitivement retiré du système.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
          try {
            await apiDelete(`/staff/${staff.id}`);
            loadData();
          } catch {
            Alert.alert("Erreur", "Suppression impossible");
          }
        }},
      ]
    );
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <LoadingScreen message="Chargement de l'équipe..." />
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.backBtn} onPress={() => (navigation as any).openDrawer()}>
                <MaterialIcons name="menu" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Gestion d'Équipe</Text>
              <TouchableOpacity style={styles.addBtn} onPress={openCreateModal}>
                <MaterialIcons name="person_add" size={20} color="#000" />
                <Text style={styles.addBtnText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarWrapper}>
              <View style={styles.searchBar}>
                <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.3)" />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Rechercher un membre..."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>
            </View>
          </View>

          <FlatList
            data={filteredStaff}
            keyExtractor={(s) => s.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <MaterialIcons name="people-outline" size={48} color="rgba(255,255,255,0.2)" style={{marginBottom: 16}} />
                <Text style={styles.emptyCardTitle}>Aucun membre trouvé</Text>
                <Text style={styles.emptyCardText}>Ajoutez vos employés pour gérer leurs accès.</Text>
              </View>
            }
            renderItem={({ item: staff }) => (
              <View style={styles.staffCard}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>{staff.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.staffInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{staff.role?.name}</Text>
                    </View>
                  </View>
                  <Text style={styles.staffIdText}>ID: {staff.identifier}</Text>
                </View>
                <View style={styles.staffActions}>
                  <TouchableOpacity onPress={() => openEditModal(staff)} style={styles.editBtn}>
                    <MaterialIcons name="edit" size={20} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(staff)} style={styles.deleteBtn}>
                    <MaterialIcons name="delete-outline" size={20} color="#e74c3c" />
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
              <Text style={styles.modalTitle}>{editingStaff ? "Modifier membre" : "Nouvel employé"}</Text>
              <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
                <Text style={styles.modalSave}>{editingStaff ? "Sauvegarder" : "Créer"}</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Nom Complet *</Text>
                <TextInput 
                  style={styles.formInput} 
                  value={form.name} 
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} 
                  placeholder="Ex: Jean Kouassi" 
                  placeholderTextColor="rgba(255,255,255,0.3)" 
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Identifiant de connexion (Optionnel)</Text>
                <TextInput 
                  style={styles.formInput} 
                  value={form.identifier} 
                  onChangeText={(v) => setForm((f) => ({ ...f, identifier: v }))} 
                  placeholder="Ex: jean.k" 
                  autoCapitalize="none"
                  placeholderTextColor="rgba(255,255,255,0.3)" 
                />
                <Text style={styles.formHint}>Sera généré automatiquement si vide.</Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>PIN de sécurité (4 chiffres) {editingStaff && "(Laisser vide pour ne pas changer)"}</Text>
                <TextInput 
                  style={styles.formInput} 
                  value={form.pin} 
                  onChangeText={(v) => setForm((f) => ({ ...f, pin: v.slice(0, 4) }))} 
                  keyboardType="numeric" 
                  secureTextEntry 
                  maxLength={4} 
                  placeholder="••••" 
                  placeholderTextColor="rgba(255,255,255,0.3)" 
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Rôle & Permissions *</Text>
                <View style={styles.roleList}>
                  {roles.map((role) => (
                    <TouchableOpacity 
                      key={role.id} 
                      style={[styles.roleChip, form.roleId === role.id && styles.roleChipActive]} 
                      onPress={() => setForm((f) => ({ ...f, roleId: role.id }))}
                    >
                      <Text style={[styles.roleChipText, form.roleId === role.id && styles.roleChipTextActive]}>
                        {role.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === "android" ? 60 : 30, // pushed down to avoid notch
    paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)"
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
  addBtnText: { color: "#000", fontSize: 13, fontWeight: "700" },

  searchBarWrapper: { marginTop: 4 },
  searchBar: { 
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", 
    borderRadius: 12, paddingHorizontal: 12, height: 46, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" 
  },
  searchInput: { flex: 1, color: "#fff", marginLeft: 8, fontSize: 14, fontWeight: "600" },

  list: { padding: 20, gap: 12, paddingBottom: 40 },
  staffCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20, padding: 16
  },
  staffAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(96, 165, 250, 0.1)", alignItems: "center", justifyContent: "center", marginRight: 16 },
  staffAvatarText: { fontSize: 20, fontWeight: "800", color: "#60a5fa" },
  staffInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  staffName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  roleBadge: { backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  roleBadgeText: { fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: "700", textTransform: "uppercase" },
  staffIdText: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "500" },
  
  staffActions: { flexDirection: "row", gap: 8 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(231, 76, 60, 0.1)", alignItems: "center", justifyContent: "center" },

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
  modalContent: { padding: 20, gap: 24 },

  formField: { gap: 8 },
  formLabel: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" },
  formInput: {
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: "#fff",
  },
  formHint: { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: -4 },
  roleList: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roleChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  roleChipActive: { backgroundColor: "#fff", borderColor: "#fff" },
  roleChipText: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.6)" },
  roleChipTextActive: { color: "#000" },
});