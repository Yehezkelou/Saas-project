import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TableApi, type TableData, CycleApi, OrderApi, type Order } from "../../api";
import { usePosStore, useAuthStore } from "../../stores";
import { LoadingPage, Modal, Button, OrderStatusBadge, showToast } from "../../components/ui";
import { formatPrice } from "../../theme";
import { motion, AnimatePresence } from "framer-motion";
import { FiMonitor, FiLogOut, FiUsers, FiClock, FiGrid, FiCreditCard, FiPlus, FiDollarSign } from "react-icons/fi";
import { getEstablishmentLabels } from "../../utils/establishment.helper";
import { ExpenseModal } from "../../components/ExpenseModal";

const TABLE_STATUS_CFG: Record<string, { label: string; bg: string; border: string; text: string; shadow: string }> = {
  free:     { label: "Libre",        bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.5)", shadow: "none" },
  occupied: { label: "Occupée",       bg: "rgba(255,107,0,0.08)",   border: "rgba(255,107,0,0.2)",    text: "var(--color-primary)", shadow: "0 10px 30px rgba(255,107,0,0.1)" },
  ready:    { label: "À servir !",    bg: "rgba(46,204,113,0.1)",   border: "rgba(46,204,113,0.3)",   text: "#2ecc71",             shadow: "0 10px 30px rgba(46,204,113,0.2)" },
};

export function TablesPage() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableData[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [cycle, setCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<{ table: TableData, orders: Order[] } | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const staff = usePosStore((s) => s.currentStaff);
  const tenant = useAuthStore((s) => s.tenant);
  const setActiveCycle = usePosStore((s) => s.setActiveCycle);
  const posLogout = usePosStore((s) => s.logout);
  const labels = getEstablishmentLabels(tenant?.businessType || "RESTAURANT");

  const load = useCallback(async () => {
    try {
      const activeCycleRes = await CycleApi.getActive();
      const [t, o] = await Promise.all([
        TableApi.list(), 
        OrderApi.list({ 
          status: ["PENDING", "VALIDATED"],
          cycleId: activeCycleRes?.id ?? "none" // On ne veut que les commandes de ce cycle
        })
      ]);
      setTables(t); 
      setCycle(activeCycleRes); 
      setActiveOrders(o);
      setActiveCycle(activeCycleRes?.id ?? null);
    } catch (err) {
      console.error("Load failed", err);
    } finally { 
      setLoading(false); 
    }
  }, [setActiveCycle]);

  useEffect(() => { 
    load(); 
    const iv = setInterval(load, 8000); 
    return () => clearInterval(iv); 
  }, [load]);

  if (loading && tables.length === 0) return <LoadingPage />;

  const activeTables = tables.filter(t => t.isActive);
  
  // Mapper les commandes par table
  const ordersByTable = new Map<string, Order[]>();
  const directOrders = activeOrders.filter(o => !o.tableId);

  activeOrders.forEach(order => {
    if (order.tableId) {
      const existing = ordersByTable.get(order.tableId) || [];
      ordersByTable.set(order.tableId, [...existing, order]);
    }
  });

  const getTableState = (table: TableData) => {
    const orders = ordersByTable.get(table.id) || [];
    if (orders.length === 0) return "free";
    if (orders.some(o => o.status === "VALIDATED")) return "ready";
    return "occupied";
  };

  const summary = {
    free: activeTables.filter(t => getTableState(t) === "free").length,
    occupied: activeTables.filter(t => getTableState(t) !== "free").length,
    ready: activeTables.filter(t => getTableState(t) === "ready").length,
  };

  const handleTableClick = (table: TableData) => {
    const orders = ordersByTable.get(table.id) || [];
    if (orders.length === 0) {
      // Table libre -> Prise de commande
      navigate(`/pos/order/${table.id}`, { state: { tableName: table.name } });
    } else {
      // Table occupée -> Voir détails
      setSelectedTable({ table, orders });
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#121214", color: "#fff", fontFamily: "var(--font)", position: "relative", overflow: "hidden" }}>
      
      {/* Background Decor */}
      <div style={{ position: "absolute", top: "-10%", left: "20%", width: "60%", height: "40%", background: "radial-gradient(ellipse, rgba(255,107,0,0.1) 0%, rgba(18,18,20,0) 70%)", filter: "blur(80px)", zIndex: 0, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ zIndex: 10, background: "rgba(255,255,255,0.02)", backdropFilter: "blur(40px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "12px clamp(12px, 4vw, 32px)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "nowrap" }}>
        {/* Profil Staff */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: "0 0 auto" }}>
          <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "14px", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, boxShadow: "0 4px 16px rgba(255,107,0,0.35)" }}>
            {staff?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontWeight: 800, fontSize: "clamp(14px, 3vw, 18px)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{staff?.name?.split(" ")[0]}</h1>
            <p style={{ fontSize: "11px", margin: 0, color: "rgba(255,255,255,.5)", fontWeight: 600, whiteSpace: "nowrap" }}>{staff?.role?.name || "Espace Staff"}</p>
          </div>
        </div>

        {/* Desktop : tous les boutons d'action */}
        <div className="hide-mobile" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "nowrap", overflowX: "auto", scrollbarWidth: "none" }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/pos/kitchen")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px 16px", borderRadius: "14px", display: "flex", gap: 8, alignItems: "center", fontWeight: 700, cursor: "pointer", fontSize: "14px", backdropFilter: "blur(10px)", whiteSpace: "nowrap" }}>
            <FiMonitor size={18} color="var(--color-primary)" /> Suivi
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/pos/order/direct", { state: { tableName: "Vente Directe" } })} style={{ background: "var(--color-primary)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "14px", display: "flex", gap: 8, alignItems: "center", fontWeight: 800, cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 15px rgba(255,107,0,0.3)", whiteSpace: "nowrap" }}>
            <FiPlus size={18} /> Vente Directe
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsExpenseModalOpen(true)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px 16px", borderRadius: "14px", display: "flex", gap: 8, alignItems: "center", fontWeight: 700, cursor: "pointer", fontSize: "14px", backdropFilter: "blur(10px)", whiteSpace: "nowrap" }}>
            <FiDollarSign size={18} color="var(--color-primary)" /> Dépense
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/pos/cycle")} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px 16px", borderRadius: "14px", display: "flex", gap: 8, alignItems: "center", fontWeight: 700, cursor: "pointer", fontSize: "14px", backdropFilter: "blur(10px)", whiteSpace: "nowrap" }}>
            <FiCreditCard size={18} /> Caisse
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { posLogout(); navigate("/pos"); }} style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.1)", color: "#ff4757", padding: "10px 16px", borderRadius: "14px", display: "flex", gap: 8, alignItems: "center", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>
            <FiLogOut size={18} /> Déconnexion
          </motion.button>
        </div>

        {/* Mobile : uniquement le bouton déconnexion — masqué sur desktop */}
        <motion.button
          className="hide-desktop"
          whileTap={{ scale: 0.9 }}
          onClick={() => { posLogout(); navigate("/pos"); }}
          style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.15)", color: "#ff4757", padding: "10px 12px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <FiLogOut size={18} />
        </motion.button>
      </div>

      {/* Cycle Warning */}
      {!cycle && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "12px 32px", background: "rgba(255,71,87,0.15)", borderBottom: "1px solid rgba(255,71,87,0.2)", display: "flex", alignItems: "center", gap: 12, fontSize: "13px", fontWeight: 700, color: "#ff4757", zIndex: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff4757", boxShadow: "0 0 10px #ff4757" }} />
          La caisse est fermée. Veuillez l'ouvrir pour pouvoir encaisser.
        </motion.div>
      )}

      {/* Plan de salle Content */}
      <div style={{ flex: 1, padding: "clamp(16px, 4vw, 32px)", display: "flex", flexDirection: "column", gap: "clamp(16px, 3vw, 32px)", zIndex: 1, overflowY: "auto" }}>
        
        {/* Info Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h2 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 12, letterSpacing: "-1px" }}>
              <FiGrid color="var(--color-primary)" /> {labels.tablesView}
            </h2>
            <p className="hide-mobile" style={{ color: "rgba(255,255,255,.4)", fontSize: "14px", margin: "6px 0 0 0", fontWeight: 600 }}>
              Structure actuelle de la salle et occupation en temps réel.
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "12px 20px", borderRadius: "20px", backdropFilter: "blur(20px)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.4)", fontSize: "13px", fontWeight: 800 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }}/> {summary.free} Libres
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)", fontSize: "13px", fontWeight: 800 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)" }}/> {summary.occupied} Occupées
            </div>
            {directOrders.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9b59b6", fontSize: "13px", fontWeight: 800 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9b59b6" }}/> {directOrders.length} Directes
              </div>
            )}
            {summary.ready > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#2ecc71", fontSize: "13px", fontWeight: 800 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 10px rgba(46,204,113,0.5)" }}/> {summary.ready} Prêtes
              </div>
            )}
          </div>
        </div>

        {/* Section Ventes Directes si présentes */}
        {directOrders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
               <div style={{ width: 24, height: 2, background: "#9b59b6" }} />
               <span style={{ fontSize: "14px", fontWeight: 800, color: "#9b59b6", textTransform: "uppercase", letterSpacing: "1px" }}>Ventes en direct / Emporté</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: "clamp(12px, 3vw, 24px)" }}>
               <motion.div
                  whileHover={{ y: -8, boxShadow: "0 15px 30px rgba(155, 89, 182, 0.2)" }}
                  onClick={() => setSelectedTable({ table: { id: "direct", name: "Vente Directe", capacity: 0, isActive: true, qrToken: "", qrUrl: "" }, orders: directOrders })}
                  style={{
                    background: "rgba(155, 89, 182, 0.1)", border: "2px solid rgba(155, 89, 182, 0.3)",
                    borderRadius: "28px", padding: "24px", display: "flex", flexDirection: "column",
                    minHeight: 120, cursor: "pointer", backdropFilter: "blur(20px)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 900, margin: 0, color: "#9b59b6" }}>Ventes Directes</h3>
                    <span style={{ background: "#9b59b6", color: "#fff", padding: "4px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 900 }}>{directOrders.length}</span>
                  </div>
                  <div style={{ marginTop: "auto", fontSize: "20px", fontWeight: 900, color: "#fff" }}>
                    {formatPrice(directOrders.reduce((s, o) => s + o.totalAmount, 0))}
                  </div>
                </motion.div>
            </div>
          </div>
        )}

        {/* Grid des Tables */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))", gap: "clamp(12px, 3vw, 24px)" }}>
          <AnimatePresence>
            {activeTables.map((table) => {
              const state = getTableState(table);
              const cfg = TABLE_STATUS_CFG[state];
              const tableOrders = ordersByTable.get(table.id) || [];
              const totalAmount = tableOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
              const pendingCount = tableOrders.filter(o => o.status === "PENDING").length;
              const readyCount = tableOrders.filter(o => o.status === "VALIDATED").length;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className="table-card"
                  style={{
                    background: cfg.bg, border: `2px solid ${cfg.border}`,
                    borderRadius: "28px", padding: "24px", display: "flex", flexDirection: "column",
                    minHeight: 180, cursor: "pointer", position: "relative", overflow: "hidden",
                    backdropFilter: "blur(20px)", boxShadow: cfg.shadow, transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  }}
                >
                  {/* Status Indicator */}
                  <div style={{ position: "absolute", top: 20, right: 24, padding: "6px 12px", borderRadius: "99px", background: state === 'free' ? "rgba(255,255,255,0.05)" : cfg.text, color: state === 'free' ? "rgba(255,255,255,0.4)" : "#000", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>
                    {cfg.label}
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: "24px", fontWeight: 900, margin: 0, color: state === 'free' ? "#fff" : cfg.text }}>{table.name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.3)", fontSize: "13px", marginTop: 4, fontWeight: 700 }}>
                      <FiUsers size={14} /> {table.capacity} places
                    </div>
                  </div>

                  <div style={{ marginTop: "auto" }}>
                    {tableOrders.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {pendingCount > 0 && (
                            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 800 }}>
                              {pendingCount} En attente
                            </div>
                          )}
                          {readyCount > 0 && (
                            <div style={{ background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.2)", color: "#2ecc71", padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 800 }}>
                              {readyCount} À servir
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: 900, color: cfg.text }}>
                          {formatPrice(totalAmount)}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.2)", fontSize: "13px", fontWeight: 700 }}>
                        <FiPlus /> Ouvrir un ticket
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Table Detail Modal */}
      <AnimatePresence>
        {selectedTable && (
          <Modal
            open={!!selectedTable}
            title={`${selectedTable.table.name} — Commandes`}
            onClose={() => setSelectedTable(null)}
            maxWidth={700}
          >
            <div style={{ background: "#1a1a1e", color: "#fff", margin: "-16px -32px -32px", padding: "32px", maxHeight: "80vh", overflowY: "auto" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Button onClick={() => navigate(`/pos/order/${selectedTable.table.id}`, { state: { tableName: selectedTable.table.name } })} size="sm" style={{ borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", color: "#fff" }}>
                    <FiPlus /> Ajouter Articles
                  </Button>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Total Table</div>
                  <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--color-primary)" }}>{formatPrice(selectedTable.orders.reduce((s,o) => s+o.totalAmount, 0))}</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {selectedTable.orders.map((order) => (
                  <div 
                    key={order.id}
                    style={{ background: "rgba(255,255,255,0.03)", padding: "24px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", cursor: "default" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.3)" }}>TICKET #ORD-{order.id.slice(0,5).toUpperCase()}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "14px", fontWeight: 700 }}>
                          <FiClock opacity={0.5} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                      {order.items.map(item => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <span style={{ fontWeight: 800, color: "var(--color-primary)" }}>{item.quantity}×</span>
                            <span style={{ fontWeight: 600 }}>{item.product.name}</span>
                          </div>
                          <span style={{ color: "rgba(255,255,255,0.4)" }}>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                      <div style={{ fontSize: "18px", fontWeight: 900 }}>{formatPrice(order.totalAmount)}</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {order.status === "VALIDATED" ? (
                          <Button 
                            onClick={() => navigate(`/pos/payment/${order.id}`, { state: { tableName: selectedTable.table.name, totalAmount: order.totalAmount } })}
                            size="sm" 
                            style={{ background: "#2ecc71", color: "#fff", border: "none", borderRadius: "10px" }}
                          >
                            Encaisser
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => navigate("/pos/kitchen")}
                            variant="ghost" 
                            size="sm" 
                            style={{ borderRadius: "10px" }}
                          >
                            Suivre
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onSuccess={() => {
          showToast("Dépense enregistrée", "success");
          load();
        }} 
      />
    </div>
  );
}