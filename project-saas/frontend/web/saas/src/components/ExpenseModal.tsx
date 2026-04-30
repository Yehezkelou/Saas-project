import React, { useState, useEffect } from "react";
import { 
  FiFileText, FiCamera, FiCheck, FiInfo, 
  FiBox, FiTool, FiHome, FiUser, FiZap, FiTarget, FiCoffee, FiPlusCircle, FiRefreshCw, FiX, FiTag
} from "react-icons/fi";
import { ExpenseApi, UploadApi, CycleApi } from "../api";
import { formatImageUrl } from "../pages/admin/MenuManagerPage";
import { Button } from "./ui";
import { motion, AnimatePresence } from "framer-motion";

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
  const [loading, setLoading]   = useState(false);
  const [cycle, setCycle]       = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "OTHER",
    imageUrl: "",
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      CycleApi.getActive().then(setCycle);
      // Bloquer le scroll body quand la modale est ouverte
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await UploadApi.uploadImage(file);
      setFormData(prev => ({ ...prev, imageUrl: res.url }));
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

  const formContent = (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Alerte caisse fermée */}
      {!cycle && (
        <div style={{
          background: "rgba(231, 76, 60, 0.1)", color: "#e74c3c",
          padding: "12px 16px", borderRadius: "14px",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: "14px", fontWeight: 600
        }}>
          <FiInfo /> La caisse est actuellement fermée.
        </div>
      )}

      {/* Montant */}
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
          Montant de la dépense
        </label>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <input
            required
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="0"
            autoFocus
            style={{
              width: "100%", textAlign: "center", border: "none",
              background: "transparent",
              fontSize: isMobile ? "42px" : "48px",
              fontWeight: 900, color: "#fff", outline: "none",
              padding: "0 50px"
            }}
          />
          <span style={{ position: "absolute", right: 0, fontSize: "16px", fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>FCFA</span>
        </div>
        <div style={{ width: 48, height: 3, background: "var(--color-primary)", margin: "6px auto 0", borderRadius: 2 }} />
      </div>

      {/* Catégories — 4 colonnes desktop, 4 colonnes mobile (icônes compactes) */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <FiTag color="var(--color-primary)" />
          <label style={{ fontSize: "13px", fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>Catégorie</label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: isMobile ? 8 : 12 }}>
          {CATEGORIES.map(c => {
            const isSelected = formData.category === c.id;
            return (
              <motion.button
                key={c.id}
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => setFormData(prev => ({ ...prev, category: c.id }))}
                style={{
                  padding: isMobile ? "10px 4px" : "16px 8px",
                  borderRadius: "16px", border: `2px solid ${isSelected ? c.color : "rgba(255,255,255,0.08)"}`,
                  background: isSelected ? `${c.color}18` : "rgba(255,255,255,0.03)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 6, cursor: "pointer",
                  color: isSelected ? c.color : "rgba(255,255,255,0.4)",
                  boxShadow: isSelected ? `0 6px 16px ${c.color}25` : "none",
                  transition: "all 0.2s"
                }}
              >
                <div style={{
                  width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: "12px",
                  background: isSelected ? c.color : "rgba(255,255,255,0.06)",
                  color: isSelected ? "#fff" : "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s"
                }}>
                  <c.icon size={isMobile ? 18 : 20} />
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>{c.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Description & Justificatif — colonne sur mobile, grille sur desktop */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: isMobile ? 14 : 24 }}>
        {/* Description */}
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Description</label>
          <div style={{ position: "relative" }}>
            <FiFileText style={{ position: "absolute", left: 14, top: 14, color: "rgba(255,255,255,0.3)" }} />
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              style={{
                width: "100%", padding: "12px 12px 12px 40px", borderRadius: "16px",
                border: "2px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)", fontSize: "14px", fontWeight: 500,
                outline: "none", minHeight: isMobile ? "80px" : "120px", resize: "none",
                color: "#fff", fontFamily: "var(--font)", transition: "border-color 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              placeholder="Détails de la dépense..."
            />
          </div>
        </div>

        {/* Justificatif */}
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
            Justificatif (Reçu)
          </label>
          <div style={{
            height: isMobile ? "100px" : "155px",
            border: "2px dashed rgba(255,255,255,0.12)", borderRadius: "16px",
            background: formData.imageUrl ? "transparent" : "rgba(255,255,255,0.03)",
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {formData.imageUrl ? (
              <>
                <img src={formatImageUrl(formData.imageUrl)} alt="Reçu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" }} />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                  style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.9)", border: "none", color: "#E74C3C", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <FiX size={16} />
                </button>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 16, color: "rgba(255,255,255,0.3)" }}>
                <div style={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(255,107,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                  {uploading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><FiRefreshCw size={18} /></motion.div>
                    : <FiCamera size={20} />
                  }
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, textAlign: "center", textTransform: "uppercase" }}>
                  {uploading ? "Envoi..." : "Photo du reçu"}
                </span>
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

      {/* Bouton Valider */}
      <Button
        type="submit"
        disabled={loading || !cycle || !formData.amount}
        loading={loading}
        fullWidth
        variant="primary"
        style={{
          height: isMobile ? "52px" : "60px", borderRadius: "18px",
          fontSize: isMobile ? "15px" : "17px", fontWeight: 900,
          boxShadow: "0 8px 24px rgba(255,107,53,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10
        }}
      >
        <FiCheck size={20} style={{ flexShrink: 0 }} />
        <span>Enregistrer la dépense</span>
      </Button>
    </form>
  );

  // ─── Sur MOBILE : Bottom Sheet ───────────────────────────────
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)", zIndex: 3000
              }}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                background: "#1a1a1e",
                borderRadius: "24px 24px 0 0",
                padding: "0 0 24px",
                zIndex: 3001,
                maxHeight: "92vh",
                display: "flex", flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {/* Drag Handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              </div>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 16px" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Nouvelle Dépense</span>
                <button
                  onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)", fontSize: 16 }}
                >
                  ✕
                </button>
              </div>

              {/* Contenu scrollable */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 16px", scrollbarWidth: "none" }}>
                {formContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // ─── Sur DESKTOP : Modal classique ──────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)", display: "flex",
            alignItems: "center", justifyContent: "center",
            zIndex: 2000, padding: 24
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              background: "#1a1a1e", borderRadius: "24px",
              width: "100%", maxWidth: 600,
              maxHeight: "90vh", display: "flex", flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 32px 16px", flexShrink: 0 }}>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Nouvelle Dépense</span>
              <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)", fontSize: 18, transition: "all 0.2s" }}>
                ✕
              </button>
            </div>
            {/* Corps scrollable */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 32px 32px", scrollbarWidth: "none" }}>
              {formContent}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
