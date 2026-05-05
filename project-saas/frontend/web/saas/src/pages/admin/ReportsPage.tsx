// src/pages/admin/ReportsPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CycleApi, StatisticApi, SubscriptionApi } from "../../api";
import { EmptyState, LoadingPage } from "../../components/ui";
import { formatPrice, formatTime } from "../../theme";
import { FiDollarSign, FiPackage, FiBarChart2, FiArchive, FiTrendingUp, FiCreditCard, FiSmartphone, FiCalendar, FiClock, FiFileText, FiPlus, FiAlertCircle, FiMousePointer, FiAlertTriangle, FiArrowLeft } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ExpenseModal } from "../../components/ExpenseModal";
import { formatImageUrl } from "./MenuManagerPage";

export function ReportsPage() {
  const navigate = useNavigate();
  const [cycles,  setCycles]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [report,  setReport]  = useState<any | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // Statistiques states
  const [activeTab, setActiveTab] = useState<"sessions" | "statistics">("sessions");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statistics, setStatistics] = useState<any[]>([]);
  const [selectedStatistic, setSelectedStatistic] = useState<any | null>(null);
  const [statLoading, setStatLoading] = useState(false);
  const [statError, setStatError] = useState<{ message: string; needsUpgrade: boolean } | null>(null);
  const [showTopProducts, setShowTopProducts] = useState(false);
  const [statisticDaysLimit, setStatisticDaysLimit] = useState(2); // FREE limit par défaut

  // Responsive state
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  useEffect(() => {
    CycleApi.list()
      .then((data) => {
        setCycles(data);
        const lastClosed = data.find((c: any) => c.status === "CLOSED");
        if (lastClosed && window.innerWidth >= 768) loadReport(lastClosed);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "statistics") {
      if (statistics.length === 0) {
        StatisticApi.list().then(data => setStatistics(data)).catch(console.error);
      }
      SubscriptionApi.get().then(res => {
        const currentPlan = res.availablePlans?.find((p: any) => p.isCurrent);
        if (currentPlan && currentPlan.limits?.statistic_days) {
          setStatisticDaysLimit(currentPlan.limits.statistic_days);
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  const calculateStatistic = async () => {
    if (!startDate || !endDate) {
      setStatError({ message: "Veuillez sélectionner les deux dates.", needsUpgrade: false });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      setStatError({ message: "La date de début doit être antérieure à la date de fin.", needsUpgrade: false });
      return;
    }

    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > statisticDaysLimit) {
      setStatError({
        message: `Abonnement insuffisant : Votre plan actuel limite l'analyse à ${statisticDaysLimit} jours maximum.`,
        needsUpgrade: true
      });
      return;
    }

    setStatLoading(true);
    setStatError(null);

    try {
      const data = await StatisticApi.calculate(startDate, endDate);
      setStatistics([data, ...statistics]);
      setSelectedStatistic(data);
      if (window.innerWidth < 768) setMobileView("detail");
    } catch (e: any) {
      if (e.response?.status === 403) {
        setStatError({
          message: e.response?.data?.message || "Limite de votre abonnement atteinte.",
          needsUpgrade: true
        });
      } else {
        setStatError({
          message: e.response?.data?.message || "Erreur lors du calcul",
          needsUpgrade: false
        });
      }
    } finally {
      setStatLoading(false);
    }
  };

  const loadReport = async (cycle: any) => {
    setSelected(cycle);
    setReportLoading(true);
    if (window.innerWidth < 768) setMobileView("detail");
    try {
      const data = await CycleApi.getReport(cycle.id);
      setReport(data);
    } catch { setReport(null); }
    finally { setReportLoading(false); }
  };

  if (loading) return <LoadingPage message="Chargement des sessions..." />;

  const methodIcons: Record<string, any> = { CASH: FiDollarSign, CARD: FiCreditCard, MOBILE_MONEY: FiSmartphone };
  const methodLabels: Record<string, string> = { CASH: "Espèces", CARD: "Carte Bancaire", MOBILE_MONEY: "Mobile Money" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--color-bg)", overflow: "hidden" }}>
      
      {/* Header */}
      <div style={{ padding: "clamp(16px, 4vw, 32px) clamp(16px, 4vw, 32px) 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          {mobileView === "detail" && (
            <button 
              className="show-mobile"
              onClick={() => setMobileView("list")}
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-light)", borderRadius: "10px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <FiArrowLeft />
            </button>
          )}
          <h1 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, margin: 0, color: "var(--color-text-primary)", letterSpacing: "-0.5px" }}>
            Rapports financiers
          </h1>
        </div>
        <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px", fontWeight: 500, marginBottom: 16 }}>
          Analysez les performances de vos sessions de caisse clôturées.
        </p>

        <div style={{ display: "flex", gap: "8px", background: "var(--color-surface)", padding: "4px", borderRadius: "12px", width: "fit-content", border: "1px solid var(--color-border-light)" }}>
          <button
            onClick={() => { setActiveTab("sessions"); setMobileView("list"); }}
            style={{
              padding: "8px 16px", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer",
              background: activeTab === "sessions" ? "var(--color-text-primary)" : "transparent",
              color: activeTab === "sessions" ? "white" : "var(--color-text-secondary)",
              border: "none", transition: "all 0.2s"
            }}
          >
            Sessions
          </button>
          <button
            onClick={() => { setActiveTab("statistics"); setMobileView("list"); }}
            style={{
              padding: "8px 16px", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer",
              background: activeTab === "statistics" ? "var(--color-text-primary)" : "transparent",
              color: activeTab === "statistics" ? "white" : "var(--color-text-secondary)",
              border: "none", transition: "all 0.2s"
            }}
          >
            Statistiques
          </button>
        </div>
      </div>

      <div className="flex-responsive" style={{ flex: 1, display: "flex", overflow: "hidden", padding: "0 clamp(16px, 4vw, 32px) 32px", gap: 24 }}>

        {activeTab === "sessions" ? (
          <>
        {/* Colonne gauche (Liste) */}
        <div className={`reports-sidebar ${mobileView === 'detail' ? 'hide-mobile' : ''}`} style={{
          display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", paddingRight: 4,
          width: "clamp(280px, 30%, 350px)"
        }}>
          <h3 style={{ fontWeight: 800, fontSize: "15px", color: "var(--color-text-tertiary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: "1px" }}>
            <FiCalendar /> Historique
          </h3>

          {cycles.length === 0 ? (
            <div style={{ background: "var(--color-surface)", border: "1px dashed var(--color-border)", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
              <FiFileText size={32} style={{ color: "var(--color-text-tertiary)", marginBottom: 12 }} />
              <p style={{ color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "14px" }}>Aucune session.</p>
            </div>
          ) : cycles.map((cycle) => {
            const isSelected = selected?.id === cycle.id;
            return (
              <motion.div
                key={cycle.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => loadReport(cycle)}
                style={{
                  padding: "16px", borderRadius: "16px", cursor: "pointer",
                  background: isSelected ? "var(--color-text-primary)" : "var(--color-surface)",
                  color: isSelected ? "var(--color-surface)" : "var(--color-text-primary)",
                  border: isSelected ? "1px solid var(--color-text-primary)" : "1px solid var(--color-border-light)",
                  boxShadow: isSelected ? "0 10px 20px -10px rgba(0,0,0,0.2)" : "var(--shadow-sm)",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: "14px", textTransform: "capitalize" }}>
                    {new Date(cycle.openedAt).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span style={{
                    fontSize: "10px", padding: "3px 8px", borderRadius: "100px", fontWeight: 800, textTransform: "uppercase",
                    background: cycle.status === "OPEN" ? "var(--color-success-faint)" : (isSelected ? "rgba(255,255,255,0.1)" : "var(--color-bg)"),
                    color: cycle.status === "OPEN" ? "var(--color-success)" : (isSelected ? "var(--color-surface)" : "var(--color-text-tertiary)"),
                  }}>
                    {cycle.status === "OPEN" ? "En cours" : "Clôturé"}
                  </span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: isSelected ? "rgba(255,255,255,0.7)" : "var(--color-text-tertiary)", fontWeight: 600 }}>
                  <span><FiClock size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} /> {formatTime(cycle.openedAt)}</span>
                  <span style={{ fontWeight: 800, color: isSelected ? "#fff" : "var(--color-text-primary)" }}>{cycle.report ? formatPrice(cycle.report.totalRevenue ?? 0) : "—"}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Colonne droite (Détails) */}
        <div className={`reports-detail-container ${mobileView === 'list' ? 'hide-mobile' : ''}`} style={{ flex: 1, overflowY: "auto", background: "var(--color-surface)", borderRadius: "24px", border: "1px solid var(--color-border-light)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", position: "relative" }}>
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EmptyState icon={<FiMousePointer size={48} color="var(--color-text-tertiary)" />} title="Sélectionnez une session" subtitle="Cliquez sur une session à gauche pour voir son rapport détaillé." />
              </motion.div>
            ) : reportLoading ? (
               <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div className="shimmer" style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 16px" }} />
                  <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>Analyse en cours...</span>
                </div>
              </motion.div>
            ) : report ? (
              <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 32, padding: "clamp(16px, 4vw, 32px)", maxWidth: 1000, margin: "0 auto" }}>

                {/* En-tête rapport */}
                <div style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: 20 }}>
                  <h2 style={{ fontWeight: 900, fontSize: "clamp(20px, 4vw, 24px)", marginBottom: 8, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 12 }}>
                    Rapport de Session
                  </h2>
                  <div style={{ fontSize: "14px", color: "var(--color-text-secondary)", fontWeight: 600, display: "flex", flexWrap: "wrap", gap: 16 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FiCalendar /> {new Date(selected.openedAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FiClock /> {formatTime(selected.openedAt)} {selected.closedAt && `— ${formatTime(selected.closedAt)}`}</span>
                  </div>
                </div>

                {/* KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(150px, 30%, 180px), 1fr))", gap: 12 }}>
                  <StatCard label="C.A Total" value={formatPrice(report.summary.totalRevenue)} icon={FiDollarSign} color="var(--color-primary)" />
                  <StatCard label="Commandes" value={String(report.summary.totalOrders)} icon={FiPackage} sub={`${report.summary.paidOrders} encaissées`} />
                  <StatCard label="Panier Moyen" value={formatPrice(report.summary.averageBasket)} icon={FiBarChart2} />
                  <StatCard label="Dépenses" value={formatPrice(report.summary.totalExpenses)} icon={FiArchive} color="var(--color-danger)" />
                  <StatCard
                    label="Bénéfice Net"
                    value={formatPrice(report.summary.totalRevenue - report.summary.totalExpenses)}
                    icon={FiTrendingUp}
                    color={(report.summary.totalRevenue - report.summary.totalExpenses) >= 0 ? "var(--color-success)" : "var(--color-danger)"}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                  {/* Paiements par méthode */}
                  {report.payments && report.payments.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <h3 style={{ fontWeight: 800, fontSize: "16px", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                        <FiCreditCard /> Méthodes d'encaissement
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {(() => {
                          const byMethod: Record<string, number> = {};
                          report.payments.forEach((p: any) => { byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount; });
                          return Object.entries(byMethod).map(([method, total]) => {
                            const Icon = methodIcons[method] || FiDollarSign;
                            return (
                              <div key={method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "var(--color-bg)", borderRadius: "16px", border: "1px solid var(--color-border-light)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, color: "var(--color-text-secondary)", fontSize: "14px" }}>
                                  <div style={{ background: "var(--color-surface)", padding: 8, borderRadius: 10, color: "var(--color-primary)" }}><Icon size={16} /></div>
                                  {methodLabels[method] ?? method}
                                </div>
                                <span style={{ fontWeight: 900, color: "var(--color-text-primary)", fontSize: "15px" }}>{formatPrice(total as number)}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Dépenses */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontWeight: 800, fontSize: "16px", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                        <FiArchive /> Dépenses session
                      </h3>
                      <button 
                        onClick={() => setIsExpenseModalOpen(true)}
                        style={{ background: "var(--color-bg)", border: "1px solid var(--color-border-light)", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <FiPlus /> Ajouter
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
                      {(!report.expenses || report.expenses.length === 0) ? (
                        <p style={{ color: "var(--color-text-tertiary)", fontSize: "13px", fontStyle: "italic", textAlign: "center", padding: "20px" }}>Aucune dépense déclarée.</p>
                      ) : report.expenses.map((expense: any) => (
                        <div key={expense.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderRadius: "12px", background: "var(--color-bg)", border: "1px solid var(--color-border-light)" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                            {expense.imageUrl && (
                              <img 
                                src={formatImageUrl(expense.imageUrl)} 
                                alt="Receipt" 
                                style={{ width: 44, height: 44, borderRadius: "10px", objectFit: "cover", border: "1px solid var(--color-border-light)", cursor: "zoom-in", flexShrink: 0 }}
                                onClick={() => window.open(formatImageUrl(expense.imageUrl), '_blank')}
                              />
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{expense.description}</div>
                              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: 2, fontWeight: 600 }}>
                                {expense.category} · {formatTime(expense.createdAt)}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontWeight: 900, color: "var(--color-danger)", fontSize: "14px", flexShrink: 0, marginLeft: 12 }}>
                            -{formatPrice(expense.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ventes par produits */}
                  {report.productSales && report.productSales.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, gridColumn: "1 / -1" }}>
                      <h3 style={{ fontWeight: 800, fontSize: "16px", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                        <FiPackage /> Ventes par produits
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                        {report.productSales.map((ps: any, idx: number) => (
                          <div key={idx} style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--color-bg)", border: "1px solid var(--color-border-light)", padding: "16px", borderRadius: "20px" }}>
                            {ps.productImageUrl ? (
                              <img src={formatImageUrl(ps.productImageUrl)} alt={ps.productName} style={{ width: 52, height: 52, borderRadius: "12px", objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 52, height: 52, borderRadius: "12px", background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <FiPackage size={22} color="var(--color-text-tertiary)" />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ps.productName}</div>
                              <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 700, marginTop: 2 }}>{ps.quantity} unités vendues</div>
                            </div>
                            <div style={{ fontWeight: 900, color: "var(--color-text-primary)", fontSize: "15px", textAlign: "right" }}>
                              {formatPrice(ps.revenue)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="unavailable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EmptyState icon={<FiAlertTriangle size={48} color="var(--color-text-tertiary)" />} title="Rapport indisponible" subtitle="Ce cycle ne dispose pas encore d'un rapport complet." />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </>
        ) : (
          /* ========================================= */
          /*         ONGLET STATISTIQUES               */
          /* ========================================= */
          <>
            <div className={`reports-sidebar ${mobileView === 'detail' ? 'hide-mobile' : ''}`} style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 4, width: "clamp(280px, 30%, 350px)" }}>
              <div style={{ background: "var(--color-surface)", padding: 20, borderRadius: 20, border: "1px solid var(--color-border-light)", boxShadow: "var(--shadow-sm)" }}>
                <h3 style={{ fontWeight: 800, fontSize: "15px", color: "var(--color-text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><FiBarChart2 /> Nouveau calcul</h3>
                {statError && (
                  <div style={{ 
                    display: "flex", flexDirection: "column", gap: 12, 
                    background: "rgba(231, 76, 60, 0.08)", color: "var(--color-danger)", 
                    padding: "16px", borderRadius: "14px", fontSize: "13px", marginBottom: 16, fontWeight: 600, border: "1px solid rgba(231, 76, 60, 0.15)" 
                  }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <FiAlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ lineHeight: 1.4 }}>{statError.message}</span>
                    </div>
                    {statError.needsUpgrade && (
                      <button 
                        onClick={() => navigate("/subscription")}
                        style={{ 
                          width: "100%", background: "var(--color-danger)", color: "white", 
                          border: "none", borderRadius: "10px", padding: "10px", fontWeight: 800, 
                          cursor: "pointer", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "12px", textTransform: "uppercase" 
                        }}
                      >
                        🚀 Passer au plan PRO
                      </button>
                    )}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--color-text-tertiary)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date de début</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-primary)", outline: "none", fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--color-text-tertiary)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date de fin</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-primary)", outline: "none", fontWeight: 600 }} />
                  </div>
                  <button onClick={calculateStatistic} disabled={statLoading} style={{ background: "var(--color-text-primary)", color: "white", padding: "14px", borderRadius: "12px", fontWeight: 800, cursor: statLoading ? "not-allowed" : "pointer", border: "none", opacity: statLoading ? 0.7 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, fontSize: "14px", marginTop: 4 }}>
                    {statLoading ? "Analyse..." : <><FiTrendingUp /> Lancer l'analyse</>}
                  </button>
                </div>
              </div>

              <h3 style={{ fontWeight: 800, fontSize: "15px", color: "var(--color-text-tertiary)", marginTop: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Historique</h3>
              {statistics.length === 0 ? (
                <p style={{ color: "var(--color-text-tertiary)", fontSize: "13px", textAlign: "center", marginTop: 16 }}>Aucun rapport généré.</p>
              ) : statistics.map(stat => {
                 const isSelected = selectedStatistic?.id === stat.id;
                 return (
                   <motion.div
                      key={stat.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => { setSelectedStatistic(stat); setShowTopProducts(false); if (window.innerWidth < 768) setMobileView("detail"); }}
                      style={{
                        padding: "16px", borderRadius: "16px", cursor: "pointer",
                        background: isSelected ? "var(--color-text-primary)" : "var(--color-surface)",
                        color: isSelected ? "var(--color-surface)" : "var(--color-text-primary)",
                        border: isSelected ? "1px solid var(--color-text-primary)" : "1px solid var(--color-border-light)",
                        boxShadow: isSelected ? "0 10px 20px -10px rgba(0,0,0,0.2)" : "var(--shadow-sm)",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: 4 }}>
                        Analyse du {new Date(stat.startDate).toLocaleDateString("fr-FR", {day: '2-digit', month: 'short'})}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: isSelected ? "rgba(255,255,255,0.7)" : "var(--color-text-tertiary)", fontWeight: 600 }}>
                        <span>Bénéfice : <b style={{ color: isSelected ? "#fff" : "var(--color-success)" }}>{formatPrice(stat.netProfit)}</b></span>
                      </div>
                    </motion.div>
                 );
              })}
            </div>

            <div className={`reports-detail-container ${mobileView === 'list' ? 'hide-mobile' : ''}`} style={{ flex: 1, overflowY: "auto", background: "var(--color-surface)", borderRadius: "24px", border: "1px solid var(--color-border-light)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
              <AnimatePresence mode="wait">
                {!selectedStatistic ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <EmptyState icon={<FiBarChart2 size={48} color="var(--color-text-tertiary)" />} title="Sélectionnez une statistique" subtitle="Générez ou cliquez sur une statistique pour voir le détail." />
                  </motion.div>
                ) : (
                  <motion.div key="stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 32, padding: "clamp(16px, 4vw, 32px)", maxWidth: 1000, margin: "0 auto" }}>
                     <div style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: 20 }}>
                      <h2 style={{ fontWeight: 900, fontSize: "clamp(20px, 4vw, 24px)", marginBottom: 8, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 12 }}>
                        Analyse de Période
                      </h2>
                      <div style={{ fontSize: "14px", color: "var(--color-text-secondary)", fontWeight: 600, display: "flex", flexWrap: "wrap", gap: 16 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FiCalendar /> Du {new Date(selectedStatistic.startDate).toLocaleDateString("fr-FR")} au {new Date(selectedStatistic.endDate).toLocaleDateString("fr-FR")}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FiClock /> Généré le {new Date(selectedStatistic.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>

                    {/* KPIs */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                      <StatCard label="Revenus Totaux" value={formatPrice(selectedStatistic.totalRevenue)} icon={FiDollarSign} color="var(--color-primary)" />
                      <StatCard 
                        label="Bénéfice Net estimé" 
                        value={formatPrice(selectedStatistic.netProfit)} 
                        icon={FiTrendingUp} 
                        color={selectedStatistic.netProfit >= 0 ? "var(--color-success)" : "var(--color-danger)"} 
                      />
                    </div>

                    {/* Top Products */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <h3 style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 8 }}><FiPackage /> Top des ventes</h3>
                        <button 
                          onClick={() => setShowTopProducts(!showTopProducts)}
                          style={{ background: "transparent", border: "1px solid var(--color-text-primary)", color: "var(--color-text-primary)", borderRadius: "10px", padding: "8px 16px", fontSize: "12px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" }}
                        >
                          {showTopProducts ? "Masquer la liste" : "Voir le détail des produits"}
                        </button>
                      </div>

                      {showTopProducts && selectedStatistic.topProducts && selectedStatistic.topProducts.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                          {selectedStatistic.topProducts.map((p: any) => (
                            <div key={p.productId} style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--color-bg)", border: "1px solid var(--color-border-light)", padding: "16px", borderRadius: "20px" }}>
                              {p.imageUrl ? (
                                <img src={formatImageUrl(p.imageUrl)} alt={p.name} style={{ width: 56, height: 56, borderRadius: "12px", objectFit: "cover", flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: 56, height: 56, borderRadius: "12px", background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <FiPackage size={24} color="var(--color-text-tertiary)" />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                                <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 700, marginTop: 2 }}>{p.quantitySold} unités vendues</div>
                              </div>
                              <div style={{ fontWeight: 900, color: "var(--color-text-primary)", fontSize: "15px", textAlign: "right" }}>
                                {formatPrice(p.revenue)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : showTopProducts ? (
                        <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px", textAlign: "center", padding: "40px", background: "var(--color-bg)", borderRadius: "20px", border: "1px dashed var(--color-border)" }}>Aucune donnée produit disponible.</p>
                      ) : null}
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onSuccess={() => loadReport(selected)} 
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = "var(--color-text-primary)", sub }: any) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border-light)",
      borderRadius: "20px",
      padding: "24px",
      display: "flex", flexDirection: "column",
      boxShadow: "var(--shadow-sm)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: "12px", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-primary)" }}>
            <Icon size={18} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--color-text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
        <div style={{ fontSize: "24px", fontWeight: 900, color, letterSpacing: "-1px" }}>{value}</div>
        {sub && <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginTop: 8, fontWeight: 700 }}>{sub}</div>}
      </div>
    </div>
  );
}
