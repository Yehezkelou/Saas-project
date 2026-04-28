// src/pages/admin/SubscriptionPage.tsx

import { useEffect, useState } from "react";
import { SubscriptionApi } from "../../api";
import { LoadingPage, showToast } from "../../components/ui";
import { FiCheck, FiAlertCircle, FiArrowUpCircle, FiCreditCard } from "react-icons/fi";
import { motion } from "framer-motion";
import { UpgradePlanModal } from "../../components/cardconfirm/UpgradePlanModal";

const PLAN_THEMES: Record<string, { bg: string; text: string; border: string; buttonBg: string; buttonText: string }> = {
  FREE:     { bg: "#FFFFFF", text: "#000000", border: "rgba(255,255,255,1)", buttonBg: "#000000", buttonText: "#FFFFFF" },
  PRO:      { bg: "rgba(30, 30, 30, 0.8)", text: "#FFFFFF", border: "var(--color-primary)", buttonBg: "var(--color-primary)", buttonText: "#FFFFFF" },
  BUSINESS: { bg: "var(--color-primary)", text: "#FFFFFF", border: "var(--color-primary-dark)", buttonBg: "#FFFFFF", buttonText: "var(--color-primary)" },
};

const PLAN_FEATURES: Record<string, string[]> = {
  FREE:     ["100 commandes/mois", "2 employés", "20 produits", "3 tables", "Rapports 7 jours"],
  PRO:      ["Commandes illimitées", "10 employés", "100 produits", "20 tables", "Rapports 90 jours", "Notifications"],
  BUSINESS: ["Tout illimité", "Staff illimité", "Produits illimités", "Tables illimitées", "Rapports 365 jours", "Notifications + push"],
};

export function SubscriptionPage() {
  const [data,    setData]    = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    SubscriptionApi.get().then(setData).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: string) => {
    setSelectedPlan(plan);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;
    const plan = selectedPlan;
    try {
      setUpgrading(true);
      await SubscriptionApi.changePlan(plan);
      showToast(`Demande envoyée pour le plan ${plan} ✓`, "success");
      const updated = await SubscriptionApi.get();
      setData(updated);
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Erreur changement de plan", "error");
    } finally { 
      setUpgrading(false); 
      setSelectedPlan(null);
    }
  };

  if (loading) return <LoadingPage />;
  if (!data) return <div style={{ padding: 24, color: "var(--color-text-secondary)" }}>Abonnement introuvable</div>;

  const sub         = data.subscription;
  const theme       = PLAN_THEMES[sub?.plan] ?? PLAN_THEMES.FREE;
  const daysLeft    = data.daysLeft ?? 0;
  const isExpiring  = data.isExpiringSoon;

  const USAGE_LABELS: Record<string, string> = {
    staff:           "Employés",
    products:        "Produits actifs",
    tables:          "Tables",
    categories:      "Catégories",
    ordersThisMonth: "Commandes ce mois",
  };

  return (
    <div style={{ 
      position: "relative",
      display: "flex", flexDirection: "column", height: "100%", 
      background: "radial-gradient(circle at top right, #1a1a1a, #000000)",
      color: "#FFFFFF",
      overflowY: "auto"
    }}>
      
      {/* Decorative Blur Element */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: "var(--color-primary)", borderRadius: "50%", filter: "blur(150px)", opacity: 0.15, pointerEvents: "none" }} />

      <div style={{ padding: "40px 48px", flex: 1, zIndex: 1, display: "flex", flexDirection: "column", gap: 32, maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: "36px", fontWeight: 800, marginBottom: 8, letterSpacing: "-1px" }}>Abonnement</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>Gérez votre forfait, surveillez votre utilisation et débloquez plus de fonctionnalités.</p>
        </motion.div>

        {/* Plan actif & Alerte */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              background: theme.bg, border: `2px solid ${theme.border}`,
              borderRadius: "24px", padding: "32px",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              backdropFilter: "blur(20px)",
              color: theme.text
            }}
          >
            <div>
              <div style={{ fontSize: "12px", letterSpacing: "1px", fontWeight: 700, opacity: 0.7, marginBottom: 4 }}>PLAN ACTUEL</div>
              <div style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1 }}>{sub?.plan}</div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: "14px", fontWeight: 500, opacity: 0.9 }}>
                {sub?.status === "ACTIVE" ? <span style={{ color: theme.text === "#000000" ? "#2ECC71" : "#4ade80" }}>● Actif</span> : `⚠️ ${sub?.status}`}
                <span>—</span>
                {isExpiring
                  ? <span style={{ color: "#ef4444", fontWeight: 700 }}>Expire dans {daysLeft} jour(s)</span>
                  : <span>Renouvellement le {new Date(sub?.expiresAt).toLocaleDateString("fr-FR")}</span>}
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => alert("Intégration Stripe/PayDunya ici.")}
                style={{ 
                  background: "transparent", color: theme.text, border: `1px solid ${theme.text}`,
                  padding: "12px 24px", borderRadius: "12px", fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s"
                }}
              >
                <FiCreditCard /> Facturation
              </button>
            </div>
          </motion.div>

          {isExpiring && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "16px", padding: "16px 20px", fontSize: "14px", color: "#fca5a5", display: "flex", alignItems: "center", gap: 12 }}
            >
              <FiAlertCircle size={20} />
              <span>Votre abonnement expire dans <strong>{daysLeft} jour(s)</strong>. Renouvelez-le pour éviter la suspension de votre caisse.</span>
            </motion.div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40 }}>
          
          {/* Utilisation (Glassmorphism Sombre) */}
          <section>
            <h2 style={{ fontWeight: 700, fontSize: "20px", marginBottom: 20 }}>Utilisation des quotas</h2>
            <div style={{ 
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", 
              borderRadius: "24px", padding: "24px", backdropFilter: "blur(10px)" 
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
                {data.usage && Object.entries(data.usage).map(([key, val]: any, i) => {
                  if (!USAGE_LABELS[key]) return null;
                  const isUnlimited = val.limit === -1;
                  const pct = isUnlimited ? 0 : Math.min((val.current / val.limit) * 100, 100);
                  const isHigh = pct >= 80;
                  const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "var(--color-primary)";

                  return (
                    <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: 8, fontWeight: 500 }}>
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{USAGE_LABELS[key]}</span>
                        <span style={{ color: isHigh ? "#fca5a5" : "#FFFFFF" }}>
                          {val.current} {isUnlimited ? <span style={{ opacity: 0.5 }}>/ ∞</span> : <span style={{ opacity: 0.5 }}>/ {val.limit}</span>}
                        </span>
                      </div>
                      {!isUnlimited ? (
                        <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.2 }} style={{ height: "100%", background: barColor, borderRadius: 4 }} />
                        </div>
                      ) : (
                        <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", backgroundSize: "200% 100%", animation: "pulse 2s infinite" }} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Comparaison des plans */}
          <section>
            <h2 style={{ fontWeight: 700, fontSize: "20px", marginBottom: 20 }}>Mettre à niveau</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {(["FREE", "PRO", "BUSINESS"] as const).map((plan, i) => {
                const planTheme = PLAN_THEMES[plan];
                const isCurrent = sub?.plan === plan;
                
                return (
                  <motion.div
                    key={plan}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                    style={{
                      border: `1px solid ${isCurrent ? planTheme.border : "rgba(255,255,255,0.1)"}`,
                      background: planTheme.bg,
                      color: planTheme.text,
                      borderRadius: "24px",
                      padding: "32px",
                      position: "relative",
                      display: "flex", flexDirection: "column",
                      boxShadow: isCurrent ? `0 10px 40px -10px ${planTheme.border}` : "none",
                      backdropFilter: "blur(20px)",
                      transform: isCurrent ? "scale(1.02)" : "scale(1)",
                      zIndex: isCurrent ? 2 : 1
                    }}
                  >
                    {isCurrent && (
                      <div style={{
                        position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                        background: planTheme.text, color: planTheme.bg,
                        fontSize: "12px", fontWeight: 800, letterSpacing: "1px",
                        padding: "4px 16px", borderRadius: "100px",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
                      }}>
                        ACTUEL
                      </div>
                    )}

                    <div style={{ fontWeight: 800, fontSize: "28px", marginBottom: 24, textAlign: "center" }}>
                      {plan}
                    </div>

                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 32, flex: 1 }}>
                      {PLAN_FEATURES[plan].map((feature) => (
                        <li key={feature} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "14px", fontWeight: 500, opacity: 0.85 }}>
                          <FiCheck style={{ color: planTheme.text === "#000000" ? "var(--color-primary)" : "#a3e635", fontSize: 18, flexShrink: 0 }} />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {!isCurrent && (
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpgrade(plan)}
                        disabled={upgrading}
                        style={{
                          background: planTheme.buttonBg, color: planTheme.buttonText,
                          border: planTheme.text === "#000000" ? "none" : "1px solid rgba(255,255,255,0.2)",
                          width: "100%", padding: "14px", borderRadius: "12px",
                          fontWeight: 700, fontSize: "14px", cursor: "pointer",
                          display: "flex", justifyContent: "center", gap: 8, alignItems: "center"
                        }}
                      >
                        <FiArrowUpCircle size={18} />
                        {sub?.plan === "FREE" || (sub?.plan === "PRO" && plan === "BUSINESS") ? "Passer à ce plan" : "Downgrader"}
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>

        </div>
      </div>

      <UpgradePlanModal 
        open={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onConfirm={confirmUpgrade}
        plan={selectedPlan || ""}
      />
    </div>
  );
}