// src/pages/admin/StaffPage.tsx

import { useEffect, useState, useCallback } from "react";
import { StaffApi, RoleApi, type Staff } from "../../api";
import { Button, Modal, Input, Select, LoadingPage, showToast } from "../../components/ui";
import { FiUsers, FiTrash2, FiUserPlus, FiShield, FiEdit2, FiUser, FiLock, FiSearch, FiGrid, FiList, FiFilter } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface StaffListProps {
  members: Staff[];
  viewMode: "grid" | "list";
  isGrouped: boolean;
  onEdit: (staff: Staff) => void;
  onDelete: (staff: Staff) => void;
}

function StaffList({ members, viewMode, isGrouped, onEdit, onDelete }: StaffListProps) {
  if (viewMode === "grid") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {members.map((staff) => (
          <motion.div key={staff.id} whileHover={{ y: -4, boxShadow: "0 12px 24px -8px rgba(0,0,0,0.15)" }} style={{ background: "var(--color-surface)", borderRadius: "20px", padding: "24px", border: "1px solid var(--color-border-light)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 54, height: 54, borderRadius: "16px", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-surface)", fontSize: "20px", fontWeight: 800, boxShadow: "0 8px 16px -4px rgba(255, 107, 0, 0.4)" }}>
                  {staff.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "16px", color: "var(--color-text-primary)", letterSpacing: "-0.3px" }}>{staff.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                     <FiUser size={10} /> ID: {staff.identifier}
                  </div>
                </div>
              </div>
               <div style={{ display: "flex", gap: 8 }}>
                 <button onClick={() => onEdit(staff)} style={{ width: 36, height: 36, borderRadius: "10px", background: "transparent", border: "1px solid var(--color-border-light)", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center" }}><FiEdit2 size={16} /></button>
                 <button onClick={() => onDelete(staff)} style={{ width: 36, height: 36, borderRadius: "10px", background: "transparent", border: "1px solid transparent", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center" }}><FiTrash2 size={16} /></button>
               </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                <FiShield size={12} /> Permissions ({staff.role?.permissions?.length ?? 0})
              </div>
              {staff.role?.permissions && staff.role.permissions.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {staff.role.permissions.slice(0, 3).map((perm: string) => (
                    <span key={perm} style={{ fontSize: "11px", padding: "4px 8px", fontWeight: 600, background: "var(--color-bg)", borderRadius: "6px", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-light)" }}>{perm.replace(/_/g, " ").toLowerCase()}</span>
                  ))}
                  {staff.role.permissions.length > 3 && <span style={{ fontSize: "11px", padding: "4px 8px", fontWeight: 600, background: "var(--color-bg)", borderRadius: "6px", color: "var(--color-text-tertiary)", border: "1px dashed var(--color-border)" }}>+{staff.role.permissions.length - 3} autres</span>}
                </div>
              ) : <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Aucune permission</span>}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="mobile-card-list" style={{ background: "var(--color-surface)", borderRadius: "20px", border: "1px solid var(--color-border-light)", overflow: "hidden" }}>
      <table className="hide-mobile" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border-light)" }}>
          <tr>
            <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>Employé</th>
            <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>Identifiant</th>
            {!isGrouped && <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>Rôle</th>}
            <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>Permissions</th>
            <th style={{ padding: "16px 24px", fontSize: "12px", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((staff) => (
            <tr key={staff.id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
              <td style={{ padding: "16px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "10px", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800 }}>
                    {staff.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{staff.name}</div>
                </div>
              </td>
              <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                {staff.identifier}
              </td>
              {!isGrouped && (
                <td style={{ padding: "16px 24px" }}>
                  <span style={{ fontSize: "12px", background: "rgba(255,107,0,0.05)", color: "var(--color-primary)", padding: "4px 10px", borderRadius: "8px", fontWeight: 700, border: "1px solid rgba(255,107,0,0.1)" }}>
                    {staff.role?.name || "Sans rôle"}
                  </span>
                </td>
              )}
              <td style={{ padding: "16px 24px" }}>
                <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
                  {staff.role?.permissions?.length || 0} permissions
                </div>
              </td>
              <td style={{ padding: "16px 24px", textAlign: "right" }}>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => onEdit(staff)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)" }}><FiEdit2 size={16} /></button>
                  <button onClick={() => onDelete(staff)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)" }}><FiTrash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Version Mobile (Liste de cartes) */}
      <div className="show-mobile" style={{ display: "none" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {members.map((staff) => (
            <div key={staff.id} style={{ padding: "16px", borderBottom: "1px solid var(--color-border-light)", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "12px", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, flexShrink: 0 }}>
                {staff.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: "15px" }}>{staff.name}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 600 }}>ID: {staff.identifier} • {staff.role?.name}</div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => onEdit(staff)} style={{ background: "none", border: "none", color: "var(--color-text-tertiary)" }}><FiEdit2 size={18} /></button>
                <button onClick={() => onDelete(staff)} style={{ background: "none", border: "none", color: "var(--color-danger)" }}><FiTrash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StaffPage() {
  const [activeTab,  setActiveTab]  = useState<"staff" | "roles">("staff");
  const [staffList,  setStaffList]  = useState<Staff[]>([]);
  const [roles,      setRoles]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [editing,    setEditing]    = useState<Staff | null>(null);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isGrouped, setIsGrouped] = useState(true);
  
  const [form,      setForm]      = useState({ name: "", pin: "", roleId: "", identifier: "" });
  const [roleForm,  setRoleForm]  = useState<{ name: string; permissions: string[] }>({ name: "", permissions: [] });

  const load = useCallback(async () => {
    try {
      const [staff, roleData] = await Promise.all([StaffApi.list(), RoleApi.list()]);
      setStaffList(staff);
      setRoles(roleData);
      if (roleData.length > 0 && !form.roleId) setForm((f) => ({ ...f, roleId: roleData[0].id }));
    } finally { setLoading(false); }
  }, [form.roleId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim())           { showToast("Nom requis", "error"); return; }
    if (!form.identifier.trim())     { showToast("Identifiant requis", "error"); return; }
    if (!editing && (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin))) {
      showToast("PIN : 4 chiffres requis pour un nouveau profil", "error"); return;
    }
    if (!form.roleId)                { showToast("Rôle requis", "error"); return; }

    try {
      setSaving(true);
      if (editing) {
        await StaffApi.update(editing.id, { 
          name: form.name.trim(), 
          identifier: form.identifier.trim(), 
          roleId: form.roleId,
          pin: form.pin || undefined
        });
        showToast("Employé mis à jour ✓", "success");
      } else {
        await StaffApi.create({ 
          name: form.name.trim(), 
          identifier: form.identifier.trim(), 
          pin: form.pin, 
          roleId: form.roleId 
        });
        showToast("Employé ajouté ✓", "success");
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: "", pin: "", roleId: roles[0]?.id ?? "", identifier: "" });
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Erreur", "error");
    } finally { setSaving(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", pin: "", roleId: roles[0]?.id ?? "", identifier: "" });
    setShowModal(true);
  };

  const openEdit = (staff: Staff) => {
    setEditing(staff);
    setForm({
      name: staff.name,
      identifier: staff.identifier,
      roleId: staff.role?.id ?? "",
      pin: "" 
    });
    setShowModal(true);
  };

  const handleDelete = async (staff: Staff) => {
    if (!window.confirm(`Supprimer ${staff.name} ? Cette action est irréversible.`)) return;
    try {
      await StaffApi.delete(staff.id);
      showToast("Employé supprimé", "success");
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Erreur suppression", "error");
    }
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) { showToast("Nom du rôle requis", "error"); return; }
    if (roleForm.permissions.length === 0) { showToast("Sélectionnez au moins une permission", "error"); return; }

    try {
      setSaving(true);
      if (editingRole) {
        await RoleApi.update(editingRole.id, roleForm);
        showToast("Rôle mis à jour", "success");
      } else {
        await RoleApi.create(roleForm);
        showToast("Rôle créé avec succès", "success");
      }
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleForm({ name: "", permissions: [] });
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Erreur", "error");
    } finally { setSaving(false); }
  };

  const openEditRole = (role: any) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, permissions: role.permissions });
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (role: any) => {
    if (!window.confirm(`Supprimer le rôle ${role.name} ?`)) return;
    try {
      await RoleApi.delete(role.id);
      showToast("Rôle supprimé", "success");
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Erreur suppression", "error");
    }
  };

  const togglePermission = (perm: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const AVAILABLE_PERMISSIONS = [
    { id: "CREATE_ORDER", label: "Créer commande", cat: "Ventes" },
    { id: "VIEW_ORDERS", label: "Voir commandes", cat: "Ventes" },
    { id: "UPDATE_ORDER_STATUS", label: "Statuts commandes", cat: "Ventes" },
    { id: "PROCESS_PAYEMENT", label: "Encaisser", cat: "Paiements" },
    { id: "VIEWS_PRODUCTS", label: "Voir menu", cat: "Produits" },
    { id: "MANAGE_PRODUCTS", label: "Gérer menu", cat: "Produits" },
    { id: "VIEW_STOCK", label: "Voir stocks", cat: "Stocks" },
    { id: "UPDATE_STOCK", label: "Gérer stocks", cat: "Stocks" },
    { id: "CREATE_EXPENSE", label: "Dépenses", cat: "Gestion" },
    { id: "OPEN_CYCLE", label: "Ouvrir caisse", cat: "Caisse" },
    { id: "CLOSE_CYCLE", label: "Fermer caisse", cat: "Caisse" },
    { id: "VIEW_REPORTS", label: "Rapports", cat: "Gestion" },
    { id: "MANAGE_STAFF", label: "Gérer staff", cat: "Admin" },
  ];

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  if (loading) return <LoadingPage message="Chargement de l'équipe..." />;

  // Filtrage des employés
  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const staffByRole: Record<string, Staff[]> = {};
  if (isGrouped) {
    filteredStaff.forEach((s) => {
      const roleName = s.role?.name ?? "Sans rôle";
      if (!staffByRole[roleName]) staffByRole[roleName] = [];
      staffByRole[roleName].push(s);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--color-bg)", overflowY: "auto" }}>
      <div style={{ padding: "clamp(16px, 4vw, 32px) clamp(16px, 4vw, 32px) 0", borderBottom: "1px solid var(--color-border-light)", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, marginBottom: 4, color: "var(--color-text-primary)", letterSpacing: "-0.5px" }}>
              Équipe & Rôles
            </h1>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px", fontWeight: 500 }}>
              Gérez votre personnel et leurs droits d'accès.
            </p>
          </div>
          
          <motion.button
            key={`action-btn-${activeTab}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={activeTab === "staff" ? openCreate : () => { setEditingRole(null); setRoleForm({ name: "", permissions: [] }); setShowRoleModal(true); }}
            style={{
              background: "var(--color-text-primary)", color: "var(--color-surface)",
              border: "none", padding: "10px 16px", borderRadius: "12px",
              display: "flex", alignItems: "center", gap: 8, fontSize: "13px", fontWeight: 700,
              cursor: "pointer", boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
              flexShrink: 0
            }}
          >
            {activeTab === "staff" ? (
              <FiUserPlus size={18} />
            ) : (
              <FiShield size={18} />
            )}
            <span className="hide-mobile">{activeTab === "staff" ? "Nouveau Profil" : "Nouveau Rôle"}</span>
          </motion.button>
        </div>

        <div style={{ display: "flex", gap: 24, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {["staff", "roles"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              style={{
                padding: "10px 4px", background: "none", border: "none",
                fontSize: "14px", fontWeight: 700, cursor: "pointer",
                whiteSpace: "nowrap",
                color: activeTab === t ? "var(--color-primary)" : "var(--color-text-tertiary)",
                borderBottom: `3px solid ${activeTab === t ? "var(--color-primary)" : "transparent"}`,
                transition: "all 0.2s"
              }}
            >
              {t === "staff" ? "Employés" : "Rôles & Permissions"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "staff" && (
        <div style={{ padding: "16px clamp(16px, 4vw, 32px)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", flex: "1 1 300px" }}>
            <FiSearch style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "10px 16px 10px 44px", borderRadius: "10px",
                border: "1px solid var(--color-border-light)", background: "var(--color-surface)",
                color: "var(--color-text-primary)", fontSize: "14px", outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
             <div style={{ display: "flex", background: "var(--color-surface)", padding: 3, borderRadius: "10px", border: "1px solid var(--color-border-light)" }}>
                <button 
                  onClick={() => setIsGrouped(!isGrouped)}
                  style={{ 
                    padding: "6px 10px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer",
                    background: isGrouped ? "var(--color-bg)" : "transparent",
                    color: isGrouped ? "var(--color-primary)" : "var(--color-text-tertiary)",
                    display: "flex", alignItems: "center", gap: 6
                  }}
                >
                  <FiFilter size={14} /> <span className="hide-mobile">Grouper</span>
                </button>
             </div>

             <div style={{ display: "flex", background: "var(--color-surface)", padding: 3, borderRadius: "10px", border: "1px solid var(--color-border-light)" }}>
                <button 
                  onClick={() => setViewMode("grid")}
                  style={{ 
                    padding: "6px 10px", borderRadius: "8px", border: "none", cursor: "pointer",
                    background: viewMode === "grid" ? "var(--color-bg)" : "transparent",
                    color: viewMode === "grid" ? "var(--color-primary)" : "var(--color-text-tertiary)"
                  }}
                >
                  <FiGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode("list")}
                  style={{ 
                    padding: "6px 10px", borderRadius: "8px", border: "none", cursor: "pointer",
                    background: viewMode === "list" ? "var(--color-bg)" : "transparent",
                    color: viewMode === "list" ? "var(--color-primary)" : "var(--color-text-tertiary)"
                  }}
                >
                  <FiList size={16} />
                </button>
             </div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 32px 32px" }}>
        <AnimatePresence mode="wait">
          {activeTab === "staff" ? (
            <motion.div
              key="staff-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: 32 }}
            >
              {filteredStaff.length === 0 ? (
                <div style={{ background: "var(--color-surface)", border: "1px dashed var(--color-border)", borderRadius: "24px", padding: "64px", textAlign: "center", marginTop: 32 }}>
                  <FiUsers size={48} style={{ color: "var(--color-text-tertiary)", marginBottom: 16 }} />
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 8 }}>Aucun employé</h2>
                  <p style={{ color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "15px", maxWidth: 400, margin: "0 auto" }}>
                    {searchQuery ? "Aucun employé ne correspond à votre recherche." : "Ajoutez votre équipe pour qu'ils puissent se connecter à la tablette de caisse avec leur code PIN."}
                  </p>
                  {!searchQuery && <Button style={{ marginTop: 24 }} onClick={openCreate}>Ajouter le premier employé</Button>}
                </div>
              ) : isGrouped ? (
                Object.entries(staffByRole).map(([roleName, members], roleIndex) => (
                  <motion.div key={roleName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: roleIndex * 0.1 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "8px", background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-light)" }}>
                        <FiShield size={16} />
                      </div>
                      <h3 style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-text-primary)" }}>{roleName}</h3>
                      <span style={{ fontSize: "12px", background: "var(--color-surface)", color: "var(--color-text-tertiary)", padding: "4px 10px", borderRadius: "100px", fontWeight: 700, border: "1px solid var(--color-border-light)" }}>
                        {members.length}
                      </span>
                    </div>
                    <StaffList members={members} viewMode={viewMode} isGrouped={isGrouped} onEdit={openEdit} onDelete={handleDelete} />
                  </motion.div>
                ))
              ) : (
                <StaffList members={filteredStaff} viewMode={viewMode} isGrouped={isGrouped} onEdit={openEdit} onDelete={handleDelete} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="roles-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(280px, 100%, 400px), 1fr))", gap: 20 }}
            >
              {roles.map((role) => (
                <motion.div key={role.id} whileHover={{ y: -4 }} style={{ background: "var(--color-surface)", borderRadius: "24px", padding: "28px", border: "1px solid var(--color-border-light)", display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(255,107,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}><FiShield size={20} /></div>
                      <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>{role.name}</h3>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEditRole(role)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--color-text-tertiary)" }}><FiEdit2 size={16} /></button>
                      <button onClick={() => handleDeleteRole(role)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--color-danger)" }}><FiTrash2 size={16} /></button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {role.permissions.map((p: string) => (
                      <span key={p} style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "8px", background: "var(--color-bg)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-light)" }}>{p.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Modifier le profil employé" : "Nouveau profil employé"} footer={
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="ghost" onClick={() => { setShowModal(false); setEditing(null); }}>Annuler</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? "Mettre à jour" : "Créer l'employé"}</Button>
          </div>
        }>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Input label="Nom complet" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Jean Dupont" />
            <Input label="Identifiant de connexion" value={form.identifier} onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))} placeholder="Ex: jean01, 101..." />
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <FiLock size={14} /> {editing ? "Changer le code PIN" : "Code PIN de connexion"}
            </label>
            <input type="password" inputMode="numeric" maxLength={4} value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="••••" style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "2px solid var(--color-border)", background: "var(--color-bg)", fontSize: "24px", letterSpacing: "16px", textAlign: "center", fontWeight: 800, color: "var(--color-text-primary)", outline: "none", transition: "border-color 0.2s" }} />
            <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: 8, fontWeight: 500 }}>
              {editing ? "Laissez vide pour conserver le code PIN actuel." : "Ce PIN (4 chiffres) servira de mot de passe exclusif sur l'interface de caisse."}
            </p>
          </div>
          {roleOptions.length > 0 && <Select label="Rôle assigné" options={roleOptions} value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))} />}
        </div>
      </Modal>

      <Modal open={showRoleModal} onClose={() => setShowRoleModal(false)} title={editingRole ? "Modifier le rôle" : "Créer un nouveau rôle"} footer={
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="ghost" onClick={() => { setShowRoleModal(false); setEditingRole(null); }}>Annuler</Button>
            <Button onClick={handleSaveRole} loading={saving}>{editingRole ? "Mettre à jour" : "Créer le rôle"}</Button>
          </div>
        }>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Input label="Nom du rôle (ex: SERVEUR, CUISINIER)" value={roleForm.name} onChange={(e) => setRoleForm(f => ({ ...f, name: e.target.value.toUpperCase() }))} placeholder="NOM DU ROLE" />
          <div>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 12, display: "block" }}>Permissions associées</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(140px, 100%, 200px), 1fr))", gap: 10 }}>
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <div key={perm.id} onClick={() => togglePermission(perm.id)} style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid", borderColor: roleForm.permissions.includes(perm.id) ? "var(--color-primary)" : "var(--color-text-tertiary)", background: roleForm.permissions.includes(perm.id) ? "rgba(255,107,0,0.05)" : "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "4px", border: "2px solid", borderColor: roleForm.permissions.includes(perm.id) ? "var(--color-primary)" : "var(--color-text-tertiary)", background: roleForm.permissions.includes(perm.id) ? "var(--color-primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", flexShrink: 0 }}>{roleForm.permissions.includes(perm.id) && "✓"}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: roleForm.permissions.includes(perm.id) ? "var(--color-primary)" : "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{perm.label}</div>
                    <div style={{ fontSize: "9px", color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>{perm.cat}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
      {/* FAB Mobile */}
      <motion.button 
        className="fab" 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={activeTab === "staff" ? openCreate : () => { setEditingRole(null); setRoleForm({ name: "", permissions: [] }); setShowRoleModal(true); }}
        title={activeTab === "staff" ? "Nouveau profil" : "Nouveau rôle"}
      >
        {activeTab === "staff" ? <FiUserPlus size={28} /> : <FiShield size={28} />}
      </motion.button>
    </div>
  );
}