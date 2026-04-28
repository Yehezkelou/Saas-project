import React, { useState, useEffect } from "react";
import { 
  FiFileText, FiCamera, FiCheck, FiInfo, 
  FiBox, FiTool, FiHome, FiUser, FiZap, FiTarget, FiCoffee, FiPlusCircle, FiRefreshCw, FiX, FiTag
} from "react-icons/fi";
import { ExpenseApi, UploadApi, CycleApi } from "../api";
import { formatImageUrl } from "../pages/admin/MenuManagerPage";
import { Modal, Button } from "./ui";
import { motion } from "framer-motion";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: "SUPPLIES",    label: "Fournitures", icon: FiBox,        color: "#3498db" },
  { id: "MAINTENANCE", label: "Entretien",   icon: FiTool,       color: "#e67e22" },
  { id: "RENT",        label: "Loyer",       icon: FiHome,       color: "#9b59b6" },
  { id: "SALARY",      label: "Salaires",    icon: FiUser,       color: "#2ecc71" },
  { id: "UTILITIES",   label: "Énergie/Eau", icon: FiZap,        color: "#f1c40f" },
  { id: "MARKETING",   label: "Commercial",  icon: FiTarget,     color: "#e74c3c" },
  { id: "EQUIPEMENT",  label: "Équipement",  icon: FiCoffee,     color: "#1abc9c" },
  { id: "OTHER",       label: "Autre",       icon: FiPlusCircle, color: "#95a5a6" },
];

export function ExpenseModal({ isOpen, onClose, onSuccess }: ExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [cycle, setCycle] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "OTHER",
    imageUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      CycleApi.getActive().then(setCycle);
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await UploadApi.uploadImage(file);
      setFormData({ ...formData, imageUrl: res.url });
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycle || !formData.amount || parseFloat(formData.amount) <= 0) return;

    setLoading(true);
    try {
      await ExpenseApi.create({
        cycleId: cycle.id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        imageUrl: formData.imageUrl,
      });
      onSuccess();
      onClose();
      setFormData({ amount: "", description: "", category: "OTHER", imageUrl: "" });
    } catch (err) {
      console.error("Create expense error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose} 
      title="Nouvelle Dépense"
      maxWidth={600}
    >
      <div style={{ paddingBottom: 10 }}>
        {!cycle && (
          <div style={{ 
            background: "rgba(231, 76, 60, 0.1)", color: "var(--color-danger)", padding: "14px", borderRadius: "16px", 
            marginBottom: "20px", display: "flex", alignItems: "center", gap: 12, fontSize: "14px", fontWeight: 600
          }}>
            <FiInfo /> La caisse est actuellement fermée.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* Section Montant - Ultra Visible */}
          <div style={{ textAlign: "center" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Montant de la dépense</label>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <input
                required
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                autoFocus
                style={{
                  width: "100%", textAlign: "center", border: "none", background: "transparent",
                  fontSize: "48px", fontWeight: 900, color: "var(--color-text-primary)", outline: "none",
                  padding: "0 40px"
                }}
              />
              <span style={{ position: "absolute", right: 0, fontSize: "20px", fontWeight: 800, color: "var(--color-text-tertiary)" }}>FCFA</span>
            </div>
            <div style={{ width: "60px", height: "4px", background: "var(--color-primary)", margin: "8px auto 0", borderRadius: "2px", opacity: 0.3 }} />
          </div>

          {/* Section Catégories - Grille Améliorée */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <FiTag color="var(--color-primary)" />
              <label style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-secondary)" }}>Catégorie</label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              {CATEGORIES.map(c => {
                const isSelected = formData.category === c.id;
                return (
                  <motion.button
                    key={c.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, category: c.id })}
                    style={{
                      padding: "16px 8px", borderRadius: "20px", border: "2px solid",
                      borderColor: isSelected ? c.color : "transparent",
                      background: isSelected ? `${c.color}15` : "var(--color-bg)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 8, transition: "all 0.2s", color: isSelected ? c.color : "var(--color-text-tertiary)",
                      cursor: "pointer", boxShadow: isSelected ? `0 10px 20px ${c.color}20` : "none"
                    }}
                  >
                    <div style={{ 
                      width: 44, height: 44, borderRadius: "14px", 
                      background: isSelected ? c.color : "rgba(0,0,0,0.03)", 
                      color: isSelected ? "#fff" : "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s"
                    }}>
                      <c.icon size={22} />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, textAlign: "center" }}>{c.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Section Description & Justificatif */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 8 }}>Description</label>
                <div style={{ position: "relative" }}>
                  <FiFileText style={{ position: "absolute", left: 14, top: 16, color: "var(--color-text-tertiary)" }} />
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: "100%", padding: "14px 14px 14px 40px", borderRadius: "18px", border: "2px solid var(--color-border-light)",
                      background: "var(--color-surface)", fontSize: "14px", fontWeight: 500, outline: "none", minHeight: "120px", resize: "none",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-border-light)"}
                    placeholder="Détails de la dépense..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 8 }}>Justificatif (Reçu)</label>
              <div style={{
                height: "155px", border: "2px dashed var(--color-border-light)", borderRadius: "20px", 
                background: formData.imageUrl ? "var(--color-bg)" : "var(--color-surface)", position: "relative",
                overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {formData.imageUrl ? (
                  <>
                    <img src={formatImageUrl(formData.imageUrl)} alt="Reçu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" }} />
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.9)", border: "none", color: "#E74C3C", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
                    >
                      <FiX size={18} />
                    </button>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 20 }}>
                    <div style={{ width: 50, height: 50, borderRadius: "16px", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                      {uploading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><FiRefreshCw size={22} /></motion.div> : <FiCamera size={24} />}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-tertiary)", textAlign: "center", textTransform: "uppercase" }}>Photo du reçu</div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleFileChange}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !cycle || !formData.amount}
            loading={loading}
            fullWidth
            variant="primary"
            style={{ 
              height: "60px", borderRadius: "20px", fontSize: "17px", fontWeight: 900,
              boxShadow: "0 10px 30px rgba(255,107,53,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12
            }}
          >
            <FiCheck size={24} style={{ flexShrink: 0 }} /> 
            <span>Enregistrer la dépense</span>
          </Button>
        </form>
      </div>
    </Modal>
  );
}
