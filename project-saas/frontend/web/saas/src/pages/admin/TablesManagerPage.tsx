// src/pages/admin/TablesManagerPage.tsx

import { useEffect, useState, useCallback } from "react";
import { TableApi, type TableData } from "../../api";
import { Button, Modal, Input, Switch, LoadingPage, showToast } from "../../components/ui";
import { FiGrid, FiPlus, FiSmartphone, FiPrinter, FiRefreshCw, FiMapPin, FiUsers, FiShoppingBag, FiMaximize } from "react-icons/fi";
import { MdOutlineTableBar, MdQrCodeScanner } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const PREMIUM_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", 
  "#f59e0b", "#10b981", "#14b8a6", "#0ea5e9", "#3b82f6"
];

export function TablesManagerPage() {
  const [tables,    setTables]    = useState<TableData[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ name: "", capacity: "4" });

  // QR modal
  const [qrTable,   setQrTable]   = useState<TableData | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await TableApi.list();
      setTables(data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) { showToast("Nom de la table requis", "error"); return; }
    try {
      setSaving(true);
      await TableApi.create({ name: form.name.trim(), capacity: parseInt(form.capacity) || 4 });
      showToast("Table créée ✓", "success");
      setShowModal(false);
      setForm({ name: "", capacity: "4" });
      load();
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Erreur", "error");
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (table: TableData) => {
    try {
      await TableApi.update(table.id, { isActive: !table.isActive });
      setTables((prev) => prev.map((t) => t.id === table.id ? { ...t, isActive: !t.isActive } : t));
    } catch { showToast("Erreur mise à jour", "error"); }
  };

  const handleRegenerateQr = async (table: TableData) => {
    if (!window.confirm(`Régénérer le QR de "${table.name}" ? L'ancien QR imprimé ne fonctionnera plus.`)) return;
    try {
      setQrLoading(true);
      const result = await TableApi.regenerateQr(table.id);
      setTables((prev) => prev.map((t) => t.id === table.id ? { ...t, qrToken: result.qrToken, qrUrl: result.qrUrl } : t));
      // Mettre à jour la modal si ouverte
      if (qrTable?.id === table.id) setQrTable((prev) => prev ? { ...prev, qrUrl: result.qrUrl, qrToken: result.qrToken } : null);
      showToast("QR régénéré — pensez à imprimer le nouveau", "success");
    } catch { showToast("Erreur régénération QR", "error"); }
    finally { setQrLoading(false); }
  };

  const handlePrintQr = (table: TableData) => {
    const color = PREMIUM_COLORS[Math.floor(Math.random() * PREMIUM_COLORS.length)];
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>QR — ${table.name}</title>
      <style>
        body { font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 40px; background: #fff; }
        .container { display: flex; flex-direction: column; align-items: center; text-align: center; border: 2px solid ${color}22; padding: 40px; border-radius: 40px; background: #fff; }
        .qr-wrapper { position: relative; padding: 20px; border: 4px solid ${color}; border-radius: 32px; background: #fff; box-shadow: 0 20px 40px ${color}15; margin-bottom: 24px; }
        h2 { font-size: 28px; font-weight: 900; margin: 0 0 4px; color: #111; letter-spacing: -1px; }
        p { font-size: 16px; color: #666; margin: 0 0 32px; font-weight: 500; }
        .url { font-size: 11px; color: #aaa; margin-top: 24px; word-break: break-all; max-width: 250px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .footer { margin-top: 40px; font-size: 12px; color: ${color}; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
      </style></head>
      <body>
        <div class="container">
          <h2>${table.name}</h2>
          <p>${table.capacity} Personnes</p>
          <div class="qr-wrapper">
             <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(table.qrUrl)}" width="240" height="240" />
          </div>
          <div class="url">${table.qrUrl}</div>
          <div class="footer">Scanner pour commander</div>
        </div>
        <script>window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  if (loading) return <LoadingPage message="Chargement des tables..." />;

  const active   = tables.filter((t) => t.isActive);
  const occupied = tables.filter((t) => t.isActive && t.activeOrder);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--color-bg)", overflowY: "auto" }}>
      
      {/* Header */}
      <div style={{ padding: "clamp(16px, 4vw, 32px) clamp(16px, 4vw, 32px) 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, marginBottom: 4, color: "var(--color-text-primary)", letterSpacing: "-0.5px" }}>
            Tables & QR Codes
          </h1>
          <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px", fontWeight: 500 }}>
            Gérez vos plans de salle et QR codes.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          style={{
            background: "var(--color-text-primary)", color: "var(--color-surface)",
            border: "none", padding: "10px 16px", borderRadius: "12px",
            display: "flex", alignItems: "center", gap: 8, fontSize: "13px", fontWeight: 700,
            cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        >
          <FiPlus /> <span className="hide-mobile">Ajouter une table</span>
          <span className="show-mobile" style={{ display: "none" }}>Table</span>
        </motion.button>
      </div>

      {/* Résumé KPIs */}
      <div style={{ padding: "0 clamp(16px, 4vw, 32px) 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Total", value: tables.length, icon: FiGrid },
          { label: "Actives", value: active.length, icon: FiMapPin, color: "var(--color-success)" },
          { label: "Occupées", value: occupied.length, icon: FiShoppingBag, color: "var(--color-primary)" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{
              background: "var(--color-surface)",
              borderRadius: "16px", padding: "16px",
              border: "1px solid var(--color-border-light)",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: "10px", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: s.color || "var(--color-text-primary)", flexShrink: 0 }}>
              <s.icon size={16} />
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: s.color || "var(--color-text-primary)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontWeight: 700, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ padding: "0 clamp(16px, 4vw, 32px) 32px", display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
        {tables.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
             style={{ background: "var(--color-surface)", border: "1px dashed var(--color-border)", borderRadius: "32px", padding: "80px 64px", textAlign: "center", marginTop: 16 }}
           >
             <motion.div
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               style={{ marginBottom: 24, fontSize: 64, color: "var(--color-text-tertiary)", display: "flex", justifyContent: "center", gap: 20 }}
             >
               <MdOutlineTableBar />
               <MdQrCodeScanner style={{ fontSize: 40, marginTop: 24, opacity: 0.5 }} />
             </motion.div>
             <h2 style={{ fontSize: "24px", fontWeight: 900, color: "var(--color-text-primary)", marginBottom: 12, letterSpacing: "-0.5px" }}>Zéro table configurée</h2>
             <p style={{ color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "16px", maxWidth: 420, margin: "0 auto", lineHeight: 1.5 }}>
               Créez votre plan de salle pour générer automatiquement des QR codes intelligents. Vos clients pourront commander en un clic.
             </p>
             <Button style={{ marginTop: 32, padding: "16px 32px" }} onClick={() => setShowModal(true)}>Installer ma première table</Button>
           </motion.div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(260px, 100%, 400px), 1fr))", gap: 16 }}>
            <AnimatePresence>
              {tables.map((table, i) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "20px",
                    padding: "24px",
                    border: "1px solid var(--color-border-light)",
                    position: "relative",
                    display: "flex", flexDirection: "column",
                    opacity: table.isActive ? 1 : 0.6,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                    transition: "opacity 0.2s"
                  }}
                >
                  {/* Ligne 1: Titre / Switch */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ 
                        width: 48, height: 48, borderRadius: "14px", 
                        background: table.isActive ? "var(--color-primary-faint)" : "var(--color-bg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: table.isActive ? "var(--color-primary)" : "var(--color-text-tertiary)",
                        fontSize: 24
                      }}>
                        <MdOutlineTableBar />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-text-primary)", margin: 0 }}>{table.name}</h3>
                        <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, marginTop: 4 }}>
                          <FiUsers size={12} /> {table.capacity} places
                        </div>
                      </div>
                    </div>
                    <div style={{ transform: "scale(0.9)" }}>
                      <Switch checked={table.isActive} onChange={() => handleToggleActive(table)} />
                    </div>
                  </div>

                  {/* Ligne 2: Statut commande (Optionnel) */}
                  <div style={{ minHeight: "36px", marginBottom: 16 }}>
                    <AnimatePresence>
                      {table.activeOrder && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          style={{
                            background: "var(--color-primary-faint)",
                            borderRadius: "10px", padding: "8px 12px",
                            display: "flex", alignItems: "center", gap: 8,
                            fontSize: "13px", fontWeight: 700, color: "var(--color-primary)"
                          }}
                        >
                          <FiShoppingBag /> Commande en cours : {table.activeOrder.status}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Ligne 3: Actions QR */}
                  <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setQrTable(table)}
                      style={{
                        flex: 1, padding: "10px", borderRadius: "10px",
                        background: "var(--color-bg)", border: "1px solid var(--color-border)",
                        fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer"
                      }}
                    >
                      <FiSmartphone size={14} /> Voir le QR
                    </motion.button>
                     <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handlePrintQr(table)}
                      style={{
                        flex: 1, padding: "10px", borderRadius: "10px",
                        background: "var(--color-text-primary)", border: "none",
                        fontSize: "13px", fontWeight: 700, color: "var(--color-surface)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer"
                      }}
                    >
                      <FiPrinter size={14} /> Imprimer QR
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal création table */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Ajouter une table"
        footer={
           <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleCreate} loading={saving}>Créer la table</Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Input
            label="Nom de la table"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Table 5, Terrasse extérieure..."
          />
          <Input
            label="Capacité (couverts)"
            type="number"
            min="0"
            max="20"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
            placeholder="Ex: 4"
          />
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", background: "var(--color-bg)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--color-border-light)", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <FiSmartphone size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
            <div>
              <strong style={{ display: "block", marginBottom: 2, color: "var(--color-text-primary)" }}>Génération Automatique</strong>
              Un QR code unique sera généré instantanément après la création.
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal QR code */}
      <Modal
        open={!!qrTable}
        onClose={() => setQrTable(null)}
        title={`Scan QR — ${qrTable?.name}`}
        maxWidth={400}
        footer={
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => handleRegenerateQr(qrTable!)} 
              disabled={qrLoading} 
              style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "var(--color-danger-faint)", color: "var(--color-danger)", border: "none", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
            >
              <FiRefreshCw /> Régénérer
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => qrTable && handlePrintQr(qrTable)} 
              style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "var(--color-text-primary)", color: "var(--color-surface)", border: "none", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
            >
              <FiPrinter /> Imprimer HQ
            </motion.button>
          </div>
        }
      >
        {qrTable && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <div style={{ 
                background: "#fff", 
                padding: "24px", borderRadius: "32px", 
                boxShadow: `0 20px 60px ${PREMIUM_COLORS[tables.indexOf(qrTable!) % PREMIUM_COLORS.length]}30`,
                border: `4px solid ${PREMIUM_COLORS[tables.indexOf(qrTable!) % PREMIUM_COLORS.length]}`,
                position: "relative",
                zIndex: 1
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrTable.qrUrl)}`}
                  alt={`QR ${qrTable.name}`}
                  style={{ display: "block", borderRadius: "16px" }}
                  width={220}
                  height={220}
                />
                
                {/* Corner Accents */}
                <FiMaximize style={{ position: "absolute", top: 12, left: 12, color: PREMIUM_COLORS[tables.indexOf(qrTable!) % PREMIUM_COLORS.length], opacity: 0.5 }} />
                <FiMaximize style={{ position: "absolute", top: 12, right: 12, color: PREMIUM_COLORS[tables.indexOf(qrTable!) % PREMIUM_COLORS.length], opacity: 0.5, transform: "rotate(90deg)" }} />
                <FiMaximize style={{ position: "absolute", bottom: 12, left: 12, color: PREMIUM_COLORS[tables.indexOf(qrTable!) % PREMIUM_COLORS.length], opacity: 0.5, transform: "rotate(-90deg)" }} />
                <FiMaximize style={{ position: "absolute", bottom: 12, right: 12, color: PREMIUM_COLORS[tables.indexOf(qrTable!) % PREMIUM_COLORS.length], opacity: 0.5, transform: "rotate(180deg)" }} />
              </div>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "20px", color: "var(--color-text-primary)" }}>{qrTable.name}</div>
              <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 600 }}>{qrTable.capacity} places</div>
            </div>

            <div style={{ background: "var(--color-bg)", padding: "10px 16px", borderRadius: "12px", fontSize: "11px", color: "var(--color-text-tertiary)", wordBreak: "break-all", textAlign: "center", width: "100%", fontWeight: 600, border: "1px dashed var(--color-border-light)" }}>
              {qrTable.qrUrl}
            </div>

            <p style={{ fontSize: "12px", textAlign: "center", margin: 0, background: "var(--color-primary-faint)", borderRadius: "8px", padding: "8px 12px", color: "var(--color-primary)", fontWeight: 500 }}>
              Le client scanne ce code et commande directement. La table sera notifiée automatiquement à la caisse.
            </p>
          </div>
        )}
      </Modal>

      {/* FAB Mobile */}
      <motion.button 
        className="fab" 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={() => setShowModal(true)} 
        title="Ajouter une table"
      >
        <FiPlus size={28} />
      </motion.button>
    </div>
  );
}