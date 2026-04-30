import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrderApi, type Order } from "../../api";
import { LoadingPage, OrderStatusBadge, Button, showToast } from "../../components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiClock, FiCheck } from "react-icons/fi";

export function KitchenPage() {
  const navigate  = useNavigate();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const data = await OrderApi.list({ status: "PENDING" });
      setOrders(data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    loadOrders(); 
    const iv = setInterval(loadOrders, 8000); 
    return () => clearInterval(iv); 
  }, []);

  const changeStatus = async (order: Order, status: string) => {
    setUpdating(order.id);
    try { 
      await OrderApi.updateStatus(order.id, status); 
      await loadOrders(); 
      showToast("Commande validée et prête !", "success");
    } catch { 
      showToast("Erreur mise à jour", "error"); 
    } finally { 
      setUpdating(null); 
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div style={{ minHeight: "100vh", background: "#121214", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "var(--font)", position: "relative", overflow: "hidden" }}>
      {/* Decorative Grid Background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "linear-gradient(rgba(255,107,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.1) 0%, rgba(18,18,20,0) 70%)", filter: "blur(80px)", zIndex: 0 }} />

      {/* Header */}
      <div style={{ zIndex: 1, background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px clamp(16px, 4vw, 24px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <button onClick={() => navigate("/pos/tables")} style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "15px" }}>
          <FiArrowLeft size={18} /> Retour
        </button>
        <h1 style={{ fontWeight: 800, fontSize: "20px", margin: 0, letterSpacing: "-0.5px" }}>Vue Cuisine (KDS)</h1>
        <div style={{ background: orders.length > 0 ? "rgba(255,71,87,0.2)" : "rgba(46,204,113,0.2)", color: orders.length > 0 ? "#ff4757" : "#2ecc71", border: `1px solid ${orders.length > 0 ? "rgba(255,71,87,0.3)" : "rgba(46,204,113,0.3)"}`, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px" }}>
          {orders.length}
        </div>
      </div>

      <div style={{ flex: 1, padding: "32px", display: "flex", flexDirection: "column", zIndex: 1, overflowY: "auto" }}>
        {orders.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "64px", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "32px", maxWidth: 400 }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
              <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: 800 }}>Cuisine Libre</h2>
              <p style={{ margin: 0, color: "rgba(255,255,255,.5)", fontSize: "14px", lineHeight: 1.5 }}>Toutes les commandes ont été préparées et envoyées en salle.</p>
            </motion.div>
          </div>
        ) : (
          <div className="kds-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: 20, alignContent: "start" }}>
            <AnimatePresence>
              {orders.map((order) => {
                const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                const isUrgent = mins >= 15;
                const isPending = order.status === "PENDING";
                
                return (
                    <motion.div 
                      key={order.id} 
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="kds-card"
                      style={{ 
                        background: isUrgent ? "rgba(255,71,87,0.05)" : "rgba(255,255,255,0.03)", 
                        borderRadius: "24px", 
                        overflow: "hidden", 
                        border: `1px solid ${isUrgent ? "rgba(255,71,87,0.3)" : "rgba(255,255,255,0.05)"}`, 
                        backdropFilter: "blur(20px)",
                        display: "flex", flexDirection: "column"
                      }}
                    >
                    {/* Header Carte */}
                    <div style={{ background: isUrgent ? "rgba(255,71,87,0.1)" : "rgba(0,0,0,0.2)", borderBottom: `1px solid ${isUrgent ? "rgba(255,71,87,0.2)" : "rgba(255,255,255,0.05)"}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.5px" }}>{order.table?.name}</div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "13px", fontWeight: 700, color: isUrgent ? "#ff4757" : "rgba(255,255,255,.6)", background: isUrgent ? "rgba(255,71,87,0.15)" : "transparent", padding: isUrgent ? "4px 8px" : "0", borderRadius: "8px" }}>
                        <FiClock /> {mins} min
                      </div>
                    </div>
                    
                    {/* Items */}
                    <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        {order.items?.map((item) => (
                          <div key={item.id} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                            <div style={{ background: isPending ? "rgba(255,255,255,0.1)" : "rgba(255,107,0,0.15)", color: isPending ? "#fff" : "var(--color-primary)", padding: "4px 8px", borderRadius: "8px", fontWeight: 800, fontSize: "14px", minWidth: 36, textAlign: "center" }}>
                              {item.quantity}×
                            </div>
                            <div style={{ flex: 1, fontSize: "16px", fontWeight: 600, color: "rgba(255,255,255,0.9)", marginTop: 2, lineHeight: 1.4 }}>
                              {item.product?.name}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{ marginTop: "auto", paddingTop: 16 }}>
                        {isPending && (
                          <Button 
                            onClick={() => changeStatus(order, "VALIDATED")} 
                            loading={updating === order.id}
                            fullWidth
                            style={{ padding: "14px", fontSize: "15px", borderRadius: "14px", fontWeight: 800, background: "var(--color-success)", border: "none", color: "#fff", display: "flex", justifyContent: "center", gap: 8, boxShadow: "0 8px 16px rgba(46,204,113,0.3)" }}
                          >
                            <FiCheck /> Valider (Prêt)
                          </Button>
                        )}

                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}