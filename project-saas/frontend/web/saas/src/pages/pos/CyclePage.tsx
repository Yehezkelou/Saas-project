import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CycleApi, ExpenseApi, StaffApi } from "../../api";
import { usePosStore } from "../../stores";
import { Button, LoadingPage, showToast } from "../../components/ui";
import { formatPrice, formatTime } from "../../theme";
import { motion, AnimatePresence } from "framer-motion";
import { FiUnlock, FiLock, FiDollarSign, FiFileText, FiArrowLeft, FiPlus, FiArchive, FiBox, FiTool, FiHome, FiUser, FiZap, FiTarget, FiCoffee, FiPlusCircle } from "react-icons/fi";
import { ExpenseModal } from "../../components/ExpenseModal";

const CATEGORY_MAP: Record<string, { icon: any, color: string }> = {
  SUPPLIES:    { icon: FiBox,        color: "#3498db" },
  MAINTENANCE: { icon: FiTool,       color: "#e67e22" },
  RENT:        { icon: FiHome,       color: "#9b59b6" },
  SALARY:      { icon: FiUser,       color: "#2ecc71" },
  UTILITIES:   { icon: FiZap,        color: "#f1c40f" },
  MARKETING:   { icon: FiTarget,     color: "#e74c3c" },
  EQUIPEMENT:  { icon: FiCoffee,     color: "#1abc9c" },
  OTHER:       { icon: FiPlusCircle, color: "#95a5a6" },
};

export function CyclePage() {
  const navigate   = useNavigate();
  const [cycle,    setCycle]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [hasStaff, setHasStaff] = useState(false);
  const [cash,     setCash]     = useState("");
  const [notes,    setNotes]    = useState("");
  const [working,  setWorking]  = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const setActiveCycleId = usePosStore((s) => s.setActiveCycle);

  useEffect(() => {
    const init = async () => {
      try {
        const [c, staff] = await Promise.all([
          CycleApi.getActive(),
          StaffApi.list()
        ]);
        setCycle(c);
        const exists = Array.isArray(staff) && staff.length > 0;
        console.log("[CyclePage] Active Cycle:", c, "| Staff Exists:", exists);
        setHasStaff(exists);
        if (c && c.status === "OPEN") {
          setCash(c.expectedCash?.toString() || "");
          loadExpenses(c.id);
        }
      } catch (e) {
        console.error("[CyclePage] Erreur lors de l'initialisation:", e);
        setHasStaff(false);
      }
      finally { setLoading(false); }
    };
    init();
  }, []);

  const loadExpenses = async (cycleId: string) => {
    try {
      const data = await ExpenseApi.list(cycleId);
      setExpenses(data || []);
    } catch (e) {}
  };

  const handleOpen = async () => {
    try {
      setWorking(true);
      const c = await CycleApi.open(parseFloat(cash) || 0);
      setCycle(c); 
      setActiveCycleId(c.id);
      showToast("Caisse ouverte avec succès !", "success");
    } catch (err: any) { 
      showToast(err.response?.data?.message ?? "Erreur lors de l'ouverture", "error"); 
    } finally { 
      setWorking(false); 
    }
  };

  const handleClose = async () => {
    if (!cycle) return;
    if (!window.confirm("Fermer la caisse ? Toutes les commandes non encaissées devront l'être plus tard.")) return;
    try {
      setWorking(true);
      const result = await CycleApi.close(cycle.id, parseFloat(cash) || 0, notes);
      setCycle(null); 
      setActiveCycleId(null);
      const r = result.report;
      showToast(`Chiffre d'affaire : ${formatPrice(r?.totalRevenu ?? 0)}`, "success");
      navigate("/pos/tables");
    } catch (err: any) { 
      showToast(err.response?.data?.message ?? "Erreur lors de la fermeture", "error"); 
    } finally { 
      setWorking(false); 
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div style={{ minHeight: "100vh", background: "#121214", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "var(--font)", position: "relative", overflow: "hidden" }}>
      {/* Decors */}
      <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "40%", height: "40%", background: cycle ? "radial-gradient(circle, rgba(46,204,113,0.15) 0%, rgba(18,18,20,0) 70%)" : "radial-gradient(circle, rgba(255,71,87,0.15) 0%, rgba(18,18,20,0) 70%)", filter: "blur(60px)", zIndex: 0 }} />

      {/* Header */}
      <div style={{ zIndex: 1, background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/pos/tables")} style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "15px" }}>
          <FiArrowLeft size={18} /> Retour
        </button>
        <h1 style={{ fontWeight: 800, fontSize: "20px", margin: 0, letterSpacing: "-0.5px" }}>Gestion de la Caisse</h1>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ flex: 1, maxWidth: 540, margin: "0 auto", width: "100%", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 24, zIndex: 1, alignItems: "center" }}>
        {/* Status Card & Action Area */}
        {!cycle && !hasStaff ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", background: "rgba(243, 156, 18, 0.1)", border: "1px solid rgba(243, 156, 18, 0.2)", borderRadius: "24px", padding: "32px", textAlign: "center", backdropFilter: "blur(20px)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(243, 156, 18, 0.2)", color: "#f39c12", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <FiUser size={32} />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: "22px", margin: "0 0 12px 0", color: "#f39c12" }}>
              Personnel Requis
            </h2>
            <p style={{ color: "rgba(255,255,255,.7)", fontSize: "15px", margin: "0 0 24px 0", lineHeight: 1.5 }}>
              Vous devez créer au moins un membre du personnel (serveur, caissier, etc.) avant de pouvoir ouvrir la caisse et gérer les ventes.
            </p>
            <Button onClick={() => navigate("/staff")} fullWidth style={{ borderRadius: "16px", padding: "14px" }}>
              Créer mon premier Staff
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
            <div style={{ width: "100%", background: cycle ? "rgba(46,204,113,0.1)" : "rgba(255,71,87,0.1)", border: `1px solid ${cycle ? "rgba(46,204,113,0.2)" : "rgba(255,71,87,0.2)"}`, borderRadius: "24px", padding: "32px", textAlign: "center", backdropFilter: "blur(20px)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: cycle ? "rgba(46,204,113,0.2)" : "rgba(255,71,87,0.2)", color: cycle ? "#2ecc71" : "#ff4757", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                {cycle ? <FiUnlock size={32} /> : <FiLock size={32} />}
              </div>
              <h2 style={{ fontWeight: 800, fontSize: "24px", margin: "0 0 8px 0", color: cycle ? "#2ecc71" : "#ff4757" }}>
                {cycle ? "Caisse Ouverte" : "Caisse Fermée"}
              </h2>
              {cycle && <p style={{ color: "rgba(255,255,255,.7)", fontSize: "15px", margin: 0, fontWeight: 500 }}>Session démarrée à {formatTime(cycle.openedAt)}</p>}
            </div>

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
              
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
                    <FiDollarSign /> {cycle ? "Montant physique en caisse (FCFA)" : "Fond de caisse initial (FCFA)"}
                  </label>
                  {cycle && (
                    <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "99px", color: "var(--color-primary)", fontWeight: 800 }}>
                      Théorique : {formatPrice(cycle.expectedCash)}
                    </span>
                  )}
                </div>
                <input type="number" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0"
                  style={{ width: "100%", fontSize: "32px", fontWeight: 800, textAlign: "center", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff", outline: "none", transition: "border 0.2s" }} 
                  onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                {cycle && (
                  <p style={{ marginTop: 12, fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "center", fontWeight: 600 }}>
                    Le système a pré-rempli le montant théorique calculé. Ajustez si nécessaire.
                  </p>
                )}
              </div>

              <AnimatePresence>
                {cycle && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "24px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,.7)", marginBottom: 12 }}>
                        <FiFileText /> Notes de clôture (optionnel)
                      </label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Écarts de caisse, incidents..."
                        style={{ width: "100%", minHeight: 100, padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: "15px", fontFamily: "inherit", resize: "vertical", outline: "none" }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                variant={cycle ? "danger" : "primary"} 
                onClick={cycle ? handleClose : handleOpen} 
                loading={working} 
                fullWidth 
                style={{ padding: "18px", fontSize: "16px", borderRadius: "16px", fontWeight: 800, marginTop: 8 }}
              >
                {cycle ? "Clôturer la Caisse" : "Ouvrir la Caisse"}
              </Button>
            </div>

            {/* Section Dépenses */}
            {cycle && (
              <div style={{ width: "100%", marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <FiArchive color="var(--color-primary)" /> Dépenses de la session
                  </h3>
                  <button 
                    onClick={() => setShowExpenseModal(true)}
                    style={{ background: "rgba(255,107,0,0.1)", color: "var(--color-primary)", border: "none", padding: "6px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <FiPlus /> Ajouter
                  </button>
                </div>

                {expenses.length === 0 ? (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>
                    Aucune dépense enregistrée pour ce cycle.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                    {expenses.map(exp => {
                      const cfg = CATEGORY_MAP[exp.category] || CATEGORY_MAP.OTHER;
                      return (
                        <div key={exp.id} style={{ 
                          background: "rgba(255,255,255,0.03)", 
                          border: "1px solid rgba(255,255,255,0.08)", 
                          borderRadius: "20px", padding: "16px 20px", 
                          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                          boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                        }}>
                          <div style={{ width: 40, height: 40, borderRadius: "12px", background: `${cfg.color}20`, color: cfg.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <cfg.icon size={20} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exp.description}</div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "capitalize" }}>{exp.category.toLowerCase()}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, color: "#ff4757", fontSize: "15px" }}>
                              -{formatPrice(exp.amount)}
                            </div>
                            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                              {new Date(exp.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <ExpenseModal 
              isOpen={showExpenseModal} 
              onClose={() => setShowExpenseModal(false)} 
              onSuccess={() => {
                if (cycle) loadExpenses(cycle.id);
                showToast("Dépense enregistrée", "success");
              }} 
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}