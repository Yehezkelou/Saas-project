import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ProductApi, type Product, type Category, OrderApi } from "../../api";
import { usePosStore } from "../../stores";
import { Button, LoadingPage, showToast } from "../../components/ui";
import { formatPrice } from "../../theme";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiShoppingCart, FiMinus, FiPlus, FiTrash2, FiSend, FiCreditCard, FiImage } from "react-icons/fi";
import { formatImageUrl } from "../admin/MenuManagerPage";

interface CartItem { productId: string; name: string; price: number; quantity: number; }

export function OrderPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const { state }   = useLocation() as { state: { tableName: string; orderId?: string } };
  const navigate    = useNavigate();

  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab,  setActiveTab]  = useState("ALL");
  const [cart,       setCart]       = useState<CartItem[]>([]);
  const [existingOrder, setExistingOrder] = useState<any>(null);
  const [sending,    setSending]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [showCart,   setShowCart]   = useState(false);

  const activeCycleId = usePosStore((s) => s.activeCycleId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prods] = await Promise.all([ProductApi.getCategories(), ProductApi.list({ isActive: true })]);
        setCategories(cats);
        setProducts(prods);

        if (state?.orderId) {
          const order = await OrderApi.getById(state.orderId);
          setExistingOrder(order);
        }
      } catch (err) {
        showToast("Erreur lors du chargement des données", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [state?.orderId]);

  const addToCart = (product: Product) => {
    const currentQty = cart.find((i) => i.productId === product.id)?.quantity ?? 0;
    if (currentQty >= product.stock) {
      showToast("Stock insuffisant pour ce produit", "error");
      return;
    }
    setCart((prev) => {
      const ex = prev.find((i) => i.productId === product.id);
      if (ex) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const removeFromCart = (pid: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === pid);
      if (!item) return prev;
      if (item.quantity === 1) return prev.filter((i) => i.productId !== pid);
      return prev.map((i) => i.productId === pid ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const getQty = (pid: string) => cart.find((i) => i.productId === pid)?.quantity ?? 0;
  
  const cartTotal  = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const existingTotal = existingOrder?.totalAmount ?? 0;
  const grandTotal = cartTotal + existingTotal;

  const cartItemsCount = cart.reduce((s, i) => s + i.quantity, 0);
  const existingItemsCount = existingOrder?.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;
  const totalItems = cartItemsCount + existingItemsCount;

  const handleSend = async () => {
    if (!cart.length) return;
    if (!activeCycleId) { showToast("Veuillez ouvrir la caisse d'abord", "error"); navigate("/pos/cycle"); return; }
    try {
      setSending(true);
      if (state?.orderId) {
        // Ajouter à la commande existante
        await OrderApi.addItem(state.orderId, cart.map((i) => ({ productId: i.productId, quantity: i.quantity })));
        showToast(`Articles ajoutés à la commande #${state.orderId.slice(0,4).toUpperCase()}`, "success");
      } else {
        // Créer une nouvelle commande
        await OrderApi.create(cart.map((i) => ({ productId: i.productId, quantity: i.quantity })), tableId === "direct" ? undefined : tableId);
        showToast(`Commande envoyée : ${state?.tableName}`, "success");
      }
      navigate("/pos/tables");
    } catch (err: any) {
      showToast(err.response?.data?.message ?? "Erreur d'envoi", "error");
    } finally { setSending(false); }
  };

  const filtered = activeTab === "ALL" ? products : products.filter((p) => p.category.id === activeTab);

  if (loading) return <LoadingPage />;

  return (
    <div style={{ height: "100vh", background: "#121214", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "var(--font)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
        <button onClick={() => navigate("/pos/tables")} style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "15px" }}>
          <FiArrowLeft size={18} /> Retour aux Tables
        </button>
        <h1 style={{ fontWeight: 800, fontSize: "20px", margin: 0, letterSpacing: "-0.5px" }}>Prise de Commande — {state?.tableName}</h1>
        <div style={{ width: 140 }} /> {/* Equilibre header */}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        
        {/* Menu Section */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.1) 0%, rgba(18,18,20,0) 70%)", filter: "blur(80px)", zIndex: 0, pointerEvents: "none" }} />
          
          {/* Tabs Catégories */}
          <div style={{ padding: "16px 24px", display: "flex", gap: 12, overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 1, scrollbarWidth: "none" }}>
            {[{ id: "ALL", name: "Tous les produits" }, ...categories].map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <button 
                  key={cat.id} 
                  onClick={() => setActiveTab(cat.id)} 
                  style={{
                    padding: "10px 20px", borderRadius: "99px", border: `1px solid ${isActive ? "var(--color-primary)" : "rgba(255,255,255,0.1)"}`,
                    background: isActive ? "var(--color-primary)" : "rgba(255,255,255,0.03)",
                    color: isActive ? "#fff" : "rgba(255,255,255,.7)",
                    fontWeight: 700, fontSize: "14px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s"
                  }}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>

          {/* Grille Produits */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, alignContent: "start", zIndex: 1 }}>
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => {
                const qty = getQty(p.id);
                const isSelected = qty > 0;
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={p.id} 
                    onClick={() => addToCart(p)} 
                    style={{
                      background: isSelected ? "rgba(255,107,0,0.1)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isSelected ? "rgba(255,107,0,0.4)" : "rgba(255,255,255,0.05)"}`,
                      borderRadius: "20px", padding: "16px", cursor: "pointer", position: "relative",
                      display: "flex", flexDirection: "column", gap: 8, backdropFilter: "blur(10px)",
                      transition: "background 0.2s, border 0.2s"
                    }}
                  >
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      {p.imageUrl ? (
                        <img 
                          src={formatImageUrl(p.imageUrl)} 
                          alt={p.name} 
                          style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: "12px", marginBottom: 12 }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: 120, background: "rgba(255,255,255,0.05)", borderRadius: "12px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                           <FiImage size={24} color="rgba(255,255,255,0.2)" />
                        </div>
                      )}
                      <div style={{ fontWeight: 700, fontSize: "16px", color: isSelected ? "#fff" : "rgba(255,255,255,0.9)", lineHeight: 1.3, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,.5)", fontWeight: 500 }}>Stock: {p.stock}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-primary)" }}>{formatPrice(p.price)}</span>
                      {isSelected && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", borderRadius: "99px", padding: "2px" }}>
                          <button onClick={(e) => { e.stopPropagation(); removeFromCart(p.id); }} style={{ width: 28, height: 28, borderRadius: "50%", background: "transparent", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><FiMinus size={14}/></button>
                          <span style={{ fontSize: "14px", fontWeight: 800, minWidth: 16, textAlign: "center" }}>{qty}</span>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-primary)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><FiPlus size={14}/></button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Panier */}
        <div className={`pos-cart-container ${showCart ? 'pos-cart-visible' : 'pos-cart-hidden'}`} style={{ width: "100%", maxWidth: "380px", background: "rgba(20,20,22,0.98)", backdropFilter: "blur(40px)", borderLeft: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", zIndex: 100, boxShadow: "-10px 0 30px rgba(0,0,0,0.5)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "rgba(255,107,0,0.15)", color: "var(--color-primary)", padding: "10px", borderRadius: "12px" }}>
                <FiShoppingCart size={20} />
              </div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: "18px", margin: 0 }}>Ticket #{state?.orderId?.slice(0,4).toUpperCase() || "Nouveau"}</h2>
                <p style={{ color: "rgba(255,255,255,.5)", margin: 0, fontSize: "13px", fontWeight: 500 }}>{totalItems} articles</p>
              </div>
            </div>
            <button className="hide-desktop" onClick={() => setShowCart(false)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "8px", borderRadius: "10px", cursor: "pointer" }}>
              Fermer
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            {/* Articles Déjà Commandés */}
            {existingOrder && existingOrder.items.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.1)" }} />
                  Déjà commandé
                  <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.1)" }} />
                </div>
                {existingOrder.items.map((item: any) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12, opacity: 0.8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                        <span style={{ color: "var(--color-primary)", marginRight: 8 }}>{item.quantity}×</span>
                        {item.product.name}
                      </div>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence>
              {cart.length === 0 && !existingOrder ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", marginTop: 60, color: "rgba(255,255,255,.4)" }}>
                  <FiShoppingCart size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                  <p style={{ fontWeight: 600, fontSize: "14px" }}>Le ticket est vide.</p>
                  <p style={{ fontSize: "13px", marginTop: 4 }}>Sélectionnez des produits à gauche.</p>
                </motion.div>
              ) : (
                cart.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                    key={item.productId} 
                    style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 16, marginBottom: 16, borderBottom: "1px dashed rgba(255,255,255,0.1)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>{item.name}</div>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-primary)" }}>{formatPrice(item.price * item.quantity)}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: "13px", color: "rgba(255,255,255,.5)", fontWeight: 500 }}>{formatPrice(item.price)} /u</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "2px" }}>
                        <button onClick={() => removeFromCart(item.productId)} style={{ width: 28, height: 28, borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {item.quantity === 1 ? <FiTrash2 size={14} color="#ff4757" /> : <FiMinus size={14} />}
                        </button>
                        <strong style={{ minWidth: 24, textAlign: "center", fontSize: "14px" }}>{item.quantity}</strong>
                        <button onClick={() => { const p = products.find((x) => x.id === item.productId); if (p) addToCart(p); }} style={{ width: 28, height: 28, borderRadius: "8px", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FiPlus size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div style={{ padding: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ color: "rgba(255,255,255,.6)", fontSize: "15px", fontWeight: 600 }}>Total</span>
              <strong style={{ color: "#fff", fontSize: "28px", fontWeight: 800, letterSpacing: "-1px" }}>{formatPrice(grandTotal)}</strong>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Button 
                onClick={handleSend} 
                loading={sending} 
                disabled={!cart.length} 
                fullWidth
                style={{ padding: "16px", fontSize: "16px", borderRadius: "16px", fontWeight: 800, display: "flex", gap: 8, justifyContent: "center" }}
              >
                <FiSend /> Valider & Envoyer
              </Button>
              
              {state?.orderId && (
                <Button 
                  onClick={() => navigate(`/pos/payment/${state.orderId}`, { state: { tableName: state.tableName, totalAmount: grandTotal } })} 
                  fullWidth
                  style={{ padding: "16px", fontSize: "16px", borderRadius: "16px", fontWeight: 700, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", display: "flex", gap: 8, justifyContent: "center" }}
                >
                  <FiCreditCard /> Encaisser directement
                </Button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Action Button (Mobile) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowCart(true)}
        className="hide-desktop"
        style={{
          position: "fixed", bottom: 24, right: 24,
          background: "var(--color-primary)", color: "#fff",
          width: 64, height: 64, borderRadius: "20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 24px rgba(255, 107, 0, 0.4)", border: "none", zIndex: 90
        }}
      >
        <div style={{ position: "relative" }}>
          <FiShoppingCart size={28} />
          {cartItemsCount > 0 && (
            <span style={{ 
              position: "absolute", top: -8, right: -8, 
              background: "#fff", color: "var(--color-primary)", 
              fontSize: "12px", fontWeight: 900, 
              width: 20, height: 20, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {cartItemsCount}
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
}