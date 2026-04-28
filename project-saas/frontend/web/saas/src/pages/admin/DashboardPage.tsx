// src/pages/admin/DashboardPage.tsx

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CycleApi, OrderApi } from "../../api";
import { useAuthStore } from "../../stores";
import { LoadingPage, OrderStatusBadge } from "../../components/ui";
import { formatPrice, formatTime } from "../../theme";
import { FiGrid, FiUsers, FiLayout, FiFileText, FiCreditCard, FiMonitor, FiRefreshCw, FiDollarSign, FiPackage, FiTrendingUp, FiArchive, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";

import { ExpenseModal } from "../../components/ExpenseModal";

const SHORTCUTS = [
  { to: "/menu-manager",   icon: FiGrid,        label: "Gérer le menu"    },
  { to: "/staff",          icon: FiUsers,       label: "Mon équipe"        },
  { to: "/tables-manager", icon: FiLayout,      label: "Tables & QR"      },
  { to: "/reports",        icon: FiFileText,    label: "Rapports"          },
  { to: "/subscription",   icon: FiCreditCard,  label: "Abonnement"        },
  { to: "/pos",            icon: FiMonitor,     label: "Interface caisse"  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);

  const [cycle,      setCycle]      = useState<any>(null);
  const [report,     setReport]     = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staffCount, setStaffCount] = useState<number | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [c, staff] = await Promise.all([
        CycleApi.getActive(),
        import("../../api").then(m => m.StaffApi.list())
      ]);
      setCycle(c);
      setStaffCount(staff.length);

      if (c) {
        const [rep, orders] = await Promise.all([
          CycleApi.getReport(c.id),
          OrderApi.list({ cycleId: c.id }),
        ]);
        setReport(rep);
        // 5 dernières commandes non payées
        setRecentOrders(
          orders
            .filter((o: any) => o.status !== "PAID")
            .slice(0, 5)
        );
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  if (loading) return <LoadingPage message="Chargement du tableau de bord..." />;

  const kpi = report?.summary;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--color-bg)" }}>
      {/* Header */}
      <div style={{ padding: "clamp(16px, 4vw, 32px)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 800, marginBottom: 4, color: "var(--color-text-primary)", letterSpacing: "-0.5px" }}>
              Bienvenue, {user?.role === "ADMIN" ? "Administrateur" : "Manager"}
            </h1>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px", textTransform: "capitalize", fontWeight: 500 }}>
              Tableau de bord — {today}
            </p>
          </div>
          <button
            onClick={() => { setRefreshing(true); loadData(); }}
            disabled={refreshing}
            style={{ 
              background: "var(--color-surface)", border: "1px solid var(--color-border-light)", 
              borderRadius: "12px", padding: "10px 16px", cursor: "pointer", 
              fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", 
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: "var(--shadow-sm)", transition: "all 0.2s"
            }}
          >
            <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ repeat: refreshing ? Infinity : 0, duration: 1, ease: "linear" }}>
              <FiRefreshCw style={{ color: "var(--color-text-tertiary)" }} />
            </motion.div>
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 clamp(16px, 4vw, 32px) 32px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Blocker: No Staff */}
        {staffCount === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              background: "rgba(255, 107, 0, 0.1)", border: "1px solid rgba(255, 107, 0, 0.3)",
              borderRadius: "20px", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
              boxShadow: "0 10px 25px -5px rgba(255, 107, 0, 0.1)",
              flexDirection: window.innerWidth < 640 ? "column" : "row",
              textAlign: window.innerWidth < 640 ? "center" : "left"
            }}>
            <div style={{ width: 48, height: 48, borderRadius: "14px", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
              <FiUsers />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: 4 }}>Équipe non configurée</h3>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                Vous n'avez pas encore ajouté de personnel. Vous ne pourrez pas vous connecter à la caisse sans au moins un employé.
              </p>
            </div>
            <button
              onClick={() => navigate("/staff")}
              style={{ background: "var(--color-text-primary)", color: "var(--color-surface)", border: "none", borderRadius: "12px", padding: "12px 20px", cursor: "pointer", fontSize: "14px", fontWeight: 700 }}
            >
              Créer mon équipe
            </button>
          </motion.div>
        )}

        {/* Statut caisse (Alert Banner) */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
            borderRadius: "16px", fontSize: "14px", fontWeight: 500,
            background: cycle ? "var(--color-text-primary)" : "var(--color-surface)",
            color: cycle ? "var(--color-surface)" : "var(--color-text-primary)",
            border: cycle ? "none" : "1px solid var(--color-danger)",
            boxShadow: cycle ? "0 10px 30px -10px rgba(0,0,0,0.3)" : "none"
        }}>
          <div style={{ 
            width: 12, height: 12, borderRadius: "50%", 
            background: cycle ? "var(--color-success)" : "var(--color-danger)", 
            boxShadow: `0 0 0 4px ${cycle ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'}` 
          }} />
          <span style={{flex: 1}}>
            {cycle
              ? `Session de caisse active depuis ${formatTime(cycle.openedAt)}. ${report?.summary?.totalOrders ?? 0} commande(s) ce cycle.`
              : "La caisse est fermée. Vous ne pouvez pas recevoir de commandes."}
          </span>
          {!cycle && (
            <button
              onClick={() => navigate("/pos/cycle")}
              style={{ background: "var(--color-danger)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
            >
              Ouvrir la caisse
            </button>
          )}
        </motion.div>

        {/* KPIs Grid */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <h2 style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-text-primary)" }}>Résumé des performances</h2>
          </div>
          
          {kpi ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(150px, 45%, 220px), 1fr))", gap: "clamp(12px, 2vw, 20px)" }}>
              <StatCard label="Chiffre d'affaires" value={formatPrice(kpi.totalRevenue)} icon={FiDollarSign} color="var(--color-primary)" trend={"+12%"}/>
              <StatCard label="Total Commandes" value={String(kpi.totalOrders)} icon={FiPackage} sub={`${kpi.paidOrders} encaissées`} trend={"+5%"} />
              <StatCard label="Bénéfice Net" value={formatPrice(kpi.totalRevenue - kpi.totalExpenses)} icon={FiTrendingUp} color={(kpi.totalRevenue - kpi.totalExpenses) >= 0 ? "var(--color-success)" : "var(--color-danger)"} />
              <StatCard label="Dépenses Opé." value={formatPrice(kpi.totalExpenses)} icon={FiArchive} color="var(--color-text-secondary)" />
            </div>
          ) : (
            <div style={{ background: "var(--color-surface)", border: "1px dashed var(--color-border)", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
              <p style={{ color: "var(--color-text-tertiary)", fontWeight: 500 }}>
                {cycle ? "En attente des premières transactions..." : "Veuillez ouvrir la caisse pour analyser les performances."}
              </p>
            </div>
          )}
        </section>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: 24 
        }}>
          {/* Commandes en cours */}
          <section>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-text-primary)" }}>Commandes en attente</h2>
                <button onClick={() => navigate("/pos/kitchen")} style={{ color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>
                  Vue Cuisine <FiArrowRight />
                </button>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button 
                  onClick={() => setIsExpenseModalOpen(true)}
                  style={{ 
                    flex: 1, minWidth: "160px",
                    background: "var(--color-surface)", border: "1px solid var(--color-border-light)", 
                    borderRadius: "12px", padding: "10px 16px", cursor: "pointer", 
                    fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", 
                    display: "flex", alignItems: "center", gap: 8,
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <FiArchive style={{ color: "var(--color-text-tertiary)" }} /> Nouvelle Dépense
                </button>
              </div>
            </div>
            
            {recentOrders.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recentOrders.map((order, i) => (
                  <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div style={{ 
                      background: "var(--color-surface)", borderRadius: "16px", 
                      padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                      boxShadow: "var(--shadow-sm)", border: "1px solid var(--color-border-light)"
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-primary)", fontWeight: 800, flexShrink: 0 }}>
                        {order.table?.name?.split(' ')[1] || order.table?.name?.charAt(0) || "T"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, marginBottom: 2, color: "var(--color-text-primary)", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.table?.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
                          {formatTime(order.createdAt)} • {order.items?.length} articles
                        </div>
                      </div>
                      <div className="hide-mobile">
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: "15px" }}>
                        {formatPrice(order.totalAmount)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
                <div style={{ background: "var(--color-surface)", border: "1px dashed var(--color-border)", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
                    <p style={{ color: "var(--color-text-tertiary)", fontWeight: 500 }}>Aucune commande en attente.</p>
                </div>
            )}
          </section>

          {/* Raccourcis Rapides */}
          <section>
            <h2 style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-text-primary)", marginBottom: 20 }}>Raccourcis</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              {SHORTCUTS.map((s) => (
                <motion.div key={s.to} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <div onClick={() => navigate(s.to)} 
                    style={{ 
                      background: "var(--color-surface)", borderRadius: "16px", 
                      padding: "clamp(16px, 3vw, 24px) 12px", textAlign: "center", cursor: "pointer", 
                      border: "1px solid var(--color-border-light)", boxShadow: "var(--shadow-sm)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                      height: "100%"
                    }}
                  >
                    <div style={{ 
                      width: 44, height: 44, borderRadius: "50%", background: "var(--color-primary-faint)", 
                      color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 
                    }}>
                      <s.icon />
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", lineHeight: 1.2 }}>{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

      </div>
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = "var(--color-text-primary)", sub, trend }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border-light)",
      borderRadius: "20px",
      padding: "clamp(16px, 4vw, 24px)",
      display: "flex", flexDirection: "column",
      boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
      height: "100%"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "12px", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-primary)" }}>
            <Icon size={20} />
        </div>
        {trend && (
            <div style={{ fontSize: "12px", fontWeight: 700, background: "var(--color-success-faint)", color: "var(--color-success)", padding: "4px 8px", borderRadius: "100px" }}>
                {trend}
            </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: "clamp(18px, 5vw, 24px)", fontWeight: 800, color, letterSpacing: "-0.5px" }}>{value}</div>
        {sub && <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: 8, fontWeight: 500 }}>{sub}</div>}
      </div>
    </motion.div>
  );
}