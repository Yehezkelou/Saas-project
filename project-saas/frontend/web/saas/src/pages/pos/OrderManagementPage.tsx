import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OrderApi, type Order } from "../../api";
import { usePosStore, useAuthStore } from "../../stores";
import { LoadingPage, OrderStatusBadge, Button, showToast, Modal } from "../../components/ui";
import { formatPrice } from "../../theme";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiClock, FiCheckCircle, FiInbox, FiArchive, FiMoreHorizontal, FiPrinter, FiShoppingBag, FiHash, FiMapPin, FiCreditCard } from "react-icons/fi";
import { getEstablishmentLabels } from "../../utils/establishment.helper";

type TabStatus = "PENDING" | "VALIDATED" | "PAID";

export function OrderManagementPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const tenant = useAuthStore((s) => s.tenant);
  const activeCycleId = usePosStore((s) => s.activeCycleId);
  const labels = getEstablishmentLabels(tenant?.businessType || "RESTAURANT");

  const loadOrders = useCallback(async () => {
    try {
      let filters: any = {};
      filters.status = activeTab;
      if (activeTab === "PAID" && activeCycleId) {
        filters.cycleId = activeCycleId;
      }
      const data = await OrderApi.list(filters);
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, activeCycleId]);

  useEffect(() => {
    loadOrders();
    const iv = setInterval(loadOrders, 8000);
    return () => clearInterval(iv);
  }, [loadOrders]);

  const changeStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await OrderApi.updateStatus(orderId, status);
      await loadOrders();
      showToast("Statut mis à jour", "success");
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch {
      showToast("Erreur mise à jour", "error");
    } finally {
      setUpdating(null);
    }
  };

  const TABS: { id: TabStatus; label: string; icon: any; color: string }[] = [
    { id: "PENDING", label: labels.toPrepare, icon: FiInbox, color: "#f39c12" },
    { id: "VALIDATED", label: labels.ready, icon: FiCheckCircle, color: "#2ecc71" },
    { id: "PAID", label: labels.finished, icon: FiArchive, color: "rgba(255,255,255,0.5)" },
  ];

  if (loading && orders.length === 0) return <LoadingPage />;

  return (
    <div style={{ minHeight: "100vh", background: "#121214", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "var(--font)", position: "relative" }}>
      {/* Background decor */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.05) 0%, rgba(18,18,20,0) 70%)", filter: "blur(80px)", zIndex: 0 }} />

      {/* Header */}
      <div style={{ zIndex: 10, background: "rgba(255,255,255,0.02)", backdropFilter: "blur(40px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px clamp(16px, 4vw, 24px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <button onClick={() => navigate("/pos/tables")} style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "15px" }}>
          <FiArrowLeft size={18} /> Retour
        </button>
        <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(15px, 4vw, 18px)", margin: 0, letterSpacing: "-0.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Gestion des Commandes
          </h1>
          <p className="hide-mobile" style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase" }}>
            {labels.establishmentName}
          </p>
        </div>
        <div className="hide-mobile" style={{ width: 80 }} />
      </div>

      {/* Tabs Navigation */}
      <div style={{ zIndex: 5, padding: "12px 24px", background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setLoading(true); }}
              style={{
                flex: "1 0 auto", padding: "12px 20px", borderRadius: "14px", border: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "all 0.3s", position: "relative",
                background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              <tab.icon size={18} color={isActive ? tab.color : "currentColor"} />
              <span style={{ fontWeight: 700, fontSize: "14px", whiteSpace: "nowrap" }}>{tab.label}</span>
              {isActive && (
                <motion.div layoutId="activeTabProp" style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 3, background: tab.color, borderRadius: "2px 2px 0 0" }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: "24px", zIndex: 1, overflowY: "auto" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", 
              gap: 20 
            }}
          >
            {orders.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", height: "50vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", flexDirection: "column", gap: 16 }}>
                <FiInbox size={64} style={{ opacity: 0.2 }} />
                <p style={{ fontWeight: 600 }}>Aucune commande dans cette section</p>
              </div>
            ) : (
              orders.map((order) => {
                const time = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <motion.div
                    key={order.id}
                    layout
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      background: "rgba(255,255,255,0.03)", borderRadius: "22px", border: "1px solid rgba(255,255,255,0.05)", padding: "20px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 16, backdropFilter: "blur(10px)",
                    }}
                    whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.05)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-primary)" }}>{order.table?.name}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}><FiClock /> {time}</span>
                    </div>

                    <div style={{ flex: 1 }}>
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} style={{ display: "flex", gap: 8, fontSize: "14px", marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>{item.quantity}×</span>
                          <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{item.product.name}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 700, marginTop: 4 }}>+ {order.items.length - 3} autres articles</div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                      {activeTab === "PENDING" && (
                        <div style={{ display: "flex", gap: 8, width: "100%" }}>
                          <Button onClick={(e: any) => { e.stopPropagation(); changeStatus(order.id, "VALIDATED"); }} size="sm" fullWidth style={{ background: "#2ecc71", color: "#fff", border: "none", borderRadius: "12px" }} loading={updating === order.id}>
                            Valider
                          </Button>
                          <Button onClick={(e: any) => { e.stopPropagation(); changeStatus(order.id, "REJECTED"); }} size="sm" style={{ background: "rgba(255,59,48,0.1)", color: "#ff3b30", border: "none", borderRadius: "12px", width: 80 }} loading={updating === order.id}>
                            Rejeter
                          </Button>
                        </div>
                      )}
                      {activeTab === "VALIDATED" && (
                        <Button 
                          onClick={(e: any) => { 
                            e.stopPropagation(); 
                            navigate(`/pos/payment/${order.id}`, { state: { tableName: order.table?.name, totalAmount: order.totalAmount } });
                          }} 
                          size="sm" 
                          fullWidth 
                          style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "12px" }}
                        >
                          Encaisser
                        </Button>
                      )}
                      <Button onClick={(e: any) => { e.stopPropagation(); setSelectedOrder(order); }} variant="ghost" size="sm" style={{ padding: "0 10px", borderRadius: "12px" }}>
                        <FiMoreHorizontal />
                      </Button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <Modal 
            open={!!selectedOrder} 
            title={`Détails Commande`} 
            onClose={() => setSelectedOrder(null)}
            maxWidth={600}
          >
            <div style={{ background: "#1a1a1e", color: "#fff", margin: "-16px -32px -32px", padding: "32px", display: "flex", flexDirection: "column", gap: 28 }}>
              
              {/* Infos Table & Statut */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "18px", background: "rgba(255,107,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                    <FiMapPin size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{selectedOrder.table?.name}</h3>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", fontWeight: 600, margin: "2px 0 0 0" }}>#ORD-{selectedOrder.id.slice(0, 5).toUpperCase()}</p>
                  </div>
                </div>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>

              {/* Timing */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>
                    <FiClock size={14} /> Heure
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>{new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>
                    <FiHash size={14} /> Articles
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>{selectedOrder.items.length} produits</div>
                </div>
              </div>

              {/* Liste des articles */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", marginBottom: 16 }}>
                  <FiShoppingBag size={14} /> Récapitulatif du panier
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} style={{ background: "rgba(255,255,255,0.02)", padding: "14px 18px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ background: "rgba(255,107,0,0.15)", color: "var(--color-primary)", padding: "6px 12px", borderRadius: "10px", fontWeight: 800, fontSize: "15px" }}>
                          {item.quantity}×
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "15px", margin: 0 }}>{item.product.name}</p>
                          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: "2px 0 0 0" }}>{formatPrice(item.price)} / unité</p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: "rgba(255,255,255,0.9)", fontSize: "15px" }}>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Actions */}
              <div style={{ marginTop: 8, padding: "24px", background: "rgba(255,107,0,0.05)", borderRadius: "24px", border: "1px solid rgba(255,107,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                    <FiCreditCard size={20} /> Total Commande
                  </div>
                  <span style={{ fontSize: "28px", fontWeight: 900, color: "var(--color-primary)", letterSpacing: "-1px" }}>{formatPrice(selectedOrder.totalAmount || 0)}</span>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <Button variant="ghost" fullWidth style={{ borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", color: "#fff", height: "54px" }}>
                    <FiPrinter size={18} /> Ticket
                  </Button>
                  
                  {selectedOrder.status === "PENDING" && (
                    <div style={{ display: "flex", gap: 12, width: "100%" }}>
                      <Button fullWidth onClick={() => changeStatus(selectedOrder.id, "VALIDATED")} loading={updating === selectedOrder.id} style={{ borderRadius: "16px", height: "54px", background: "var(--color-success)", color: "#fff" }}>
                        <FiCheckCircle /> Valider
                      </Button>
                      <Button onClick={() => changeStatus(selectedOrder.id, "REJECTED")} loading={updating === selectedOrder.id} style={{ borderRadius: "16px", height: "54px", background: "rgba(255,59,48,0.1)", color: "#ff3b30", border: "none", width: 140 }}>
                        Rejeter
                      </Button>
                    </div>
                  )}
                  {selectedOrder.status === "VALIDATED" && (
                    <Button 
                      fullWidth 
                      onClick={() => {
                        navigate(`/pos/payment/${selectedOrder.id}`, { state: { tableName: selectedOrder.table?.name, totalAmount: selectedOrder.totalAmount } });
                        setSelectedOrder(null);
                      }} 
                      style={{ background: "var(--color-primary)", border: "none", borderRadius: "16px", color: "#fff", height: "54px" }}
                    >
                      <FiCreditCard /> Encaisser (PAYÉ)
                    </Button>
                  )}
                </div>
              </div>

            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
