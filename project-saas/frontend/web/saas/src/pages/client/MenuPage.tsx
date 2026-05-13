// src/pages/client/MenuPage.tsx

import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProductApi, CategoryApi, type Product, type Category } from "../../api";
import { useCartStore, useTableStore } from "../../stores";
import { Button, LoadingPage, SafeImage, showToast } from "../../components/ui";

import { formatPrice } from "../../theme";
import { OrderApi, type Order } from "../../api";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiShoppingCart, FiChevronLeft, FiPlus, FiMinus } from "react-icons/fi";
import { BiDrink, BiRestaurant } from "react-icons/bi";
import { formatImageUrl } from "../admin/MenuManagerPage";

const getEmojiForName = (name: string) => {
  const l = name.toLowerCase();
  if (l.includes("pizza")) return "🍕";
  if (l.includes("burger") || l.includes("hamburger")) return "🍔";
  if (l.includes("sushi") || l.includes("maki")) return "🍣";
  if (l.includes("salade") || l.includes("bowl")) return "🥗";
  if (l.includes("viande") || l.includes("steak") || l.includes("boeuf")) return "🥩";
  if (l.includes("poulet")) return "🍗";
  if (l.includes("poisson")) return "🐟";
  if (l.includes("frite")) return "🍟";
  if (l.includes("glace") || l.includes("dessert") || l.includes("sucré")) return "🍦";
  if (l.includes("gateau") || l.includes("gâteau") || l.includes("cake")) return "🍰";
  if (l.includes("biere") || l.includes("bière") || l.includes("pression")) return "🍺";
  if (l.includes("vin")) return "🍷";
  if (l.includes("cocktail")) return "🍹";
  if (l.includes("café") || l.includes("coffee") || l.includes("the") || l.includes("thé")) return "☕";
  if (l.includes("eau") || l.includes("boisson") || l.includes("jus")) return "🥤";
  return "🥘"; // Par défaut
};

// ============================================================
// MENU PAGE
// ============================================================
export function MenuPage() {
  const navigate    = useNavigate();
  const [products,  setProducts]  = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab,  setActiveTab]  = useState("ALL");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const addItem    = useCartStore((s) => s.addItem);
  const totalItems = useCartStore((s) => s.totalItems());
  const totalAmount = useCartStore((s) => s.totalAmount());
  const itemCount  = useCartStore((s) => s.itemCount);
  const tenant     = useTableStore((s) => s.tenant);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [cats, prods] = await Promise.all([
          ProductApi.getCategories ? ProductApi.getCategories() : CategoryApi.list(),
          ProductApi.list({ isActive: true })
        ]);
        setCategories(cats);
        setProducts(prods);
        setError(null);
      } catch (err: any) {
        console.error("Menu fetch error:", err);
        setError("Erreur de connexion au serveur. Vérifiez votre connexion.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    // Si pas de table session (ex: POS admin ou pas encore login), on ne charge pas
    const fetchOrders = async () => {
      try {
        const list = await OrderApi.list();
        setActiveOrders(list.filter((o: Order) => o.status !== "PAID" && o.status !== "REJECTED"));
      } catch (e) {}
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000); // Polling 8s
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeTab === "ALL" || p.category.id === activeTab;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeTab, search]);

  if (loading) return <LoadingPage message="Préparation du menu..." />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#121214", color: "#fff", fontFamily: "var(--font)" }}>
      {/* Decorative Blob */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(255,107,0,0.15) 0%, rgba(0,0,0,0) 70%)", filter: "blur(40px)", zIndex: 0, pointerEvents: "none" }} />

      {/* Top Section (Header + Categories) Sticky */}
      <div style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 10, 
        background: "rgba(18,18,20,0.9)", 
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        paddingTop: "24px"
      }}>
        {/* Header Title & Search */}
        <div style={{ padding: "0 24px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, background: "var(--color-primary)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 8px 16px rgba(255,107,0,0.3)" }}>
                 {tenant?.name?.charAt(0).toUpperCase() || "🍴"}
              </div>
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>{tenant?.name ?? "Restaurant"}</h1>
                <span style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 700, letterSpacing: "1px" }}>MENU SUR PLACE</span>
              </div>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <FiSearch style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un plat..."
              style={{
                width: "100%", background: "#1C1C1E", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "100px", padding: "14px 16px 14px 44px", color: "#fff",
                fontSize: "15px", outline: "none", transition: "border 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.05)"}
            />
          </div>
        </div>

        {/* Categories (Sticky inside Top Section) */}
        <div style={{ padding: "10px 0 16px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", paddingRight: 24, marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, opacity: 0.8 }}>Catégories</h2>
          </div>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", scrollBehavior: "smooth", paddingBottom: 10, paddingRight: 24, msOverflowStyle: "none", scrollbarWidth: "none" }}>
            {[{ id: "ALL", name: "Tout" }, ...categories].map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(cat.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    background: "transparent", border: "none", cursor: "pointer", padding: 0
                  }}
                >
                  <div style={{
                    width: 58, height: 58, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                    background: isActive ? "var(--color-primary)" : "#1C1C1E",
                    boxShadow: isActive ? "0 10px 20px rgba(255,107,0,0.3)" : "none",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}>
                    {cat.id === "ALL" ? (
                      "🔥"
                    ) : cat.name.toLowerCase().includes("boisson") || cat.name.toLowerCase().includes("drink") ? (
                      <BiDrink />
                    ) : cat.name.toLowerCase().includes("food") || cat.name.toLowerCase().includes("plat") || cat.name.toLowerCase().includes("manger") ? (
                      <BiRestaurant />
                    ) : (
                      getEmojiForName(cat.name)
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>
                    {cat.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grille produits */}
      <div style={{ padding: "0 24px", flex: 1, zIndex: 1, paddingBottom: totalItems > 0 ? 120 : 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Popular Dishes</h2>
        </div>

        {error ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: "rgba(255,59,48,0.1)", borderRadius: "24px", border: "1px solid rgba(255,59,48,0.2)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ color: "#FF3B30", fontWeight: 700, marginBottom: 8 }}>Erreur de chargement</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{error}</div>
            <Button variant="primary" style={{ marginTop: 24 }} onClick={() => window.location.reload()}>Réessayer</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.4)" }}>
            Aucun produit trouvé.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
            <AnimatePresence>

            {filtered.map((product) => {
              const qty = itemCount(product.id);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (qty >= product.stock) {
                      showToast("Stock insuffisant pour ce produit", "error");
                    } else {
                      addItem({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl });
                    }
                  }}
                  style={{
                    background: "#1C1C1E",
                    borderRadius: "32px",
                    border: `1px solid ${qty > 0 ? "var(--color-primary)" : "rgba(255,255,255,0.05)"}`,
                    cursor: "pointer", position: "relative",
                    display: "flex", flexDirection: "column",
                    boxShadow: qty > 0 ? "0 15px 35px rgba(255,107,0,0.2)" : "0 10px 30px rgba(0,0,0,0.2)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    overflow: "hidden"
                  }}
                >
                  {/* Image Area */}
                  <div style={{ height: 180, width: "100%", position: "relative", background: "#2A2A2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SafeImage 
                      src={formatImageUrl(product.imageUrl)} 
                      alt={product.name}
                      fallback={<div style={{ fontSize: 48 }}>{getEmojiForName(product.name)}</div>}
                      style={{ width: "100%", height: "100%" }}
                    />
                    
                    {/* Badge de quantité - Overlay */}
                    <AnimatePresence>
                      {qty > 0 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{
                          position: "absolute", top: 12, right: 12, background: "var(--color-primary)", color: "#000",
                          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 900, zIndex: 2, boxShadow: "0 4px 12px rgba(255,107,0,0.4)"
                        }}>
                          {qty}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Gradient overlay for text readability */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(28,28,30,0.8) 0%, transparent 40%)" }} />
                  </div>
 
                  {/* Content Area */}
                  <div style={{ padding: "12px 16px 16px" }}>
                    <div style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                      {product.category.name}
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 12px", color: "#fff", lineHeight: 1.2, height: 38, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {product.name}
                    </h3>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff" }}>{formatPrice(product.price)}</span>
                      <motion.div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (qty >= product.stock) {
                            showToast("Stock insuffisant pour ce produit", "error");
                          } else {
                            addItem({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl });
                          }
                        }}
                        whileTap={{ scale: 0.8 }}
                        style={{
                          width: 34, height: 34, borderRadius: "12px", 
                          background: qty > 0 ? "var(--color-primary)" : "rgba(255,255,255,0.1)",
                          color: qty > 0 ? "#000" : "#fff", 
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <FiPlus size={18} />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bouton panier flottant - Bottom Sheet Style */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            style={{ position: "fixed", bottom: 20, left: 24, right: 24, zIndex: 50 }}
          >
            <button
              onClick={() => navigate("/cart")}
              style={{
                width: "100%", background: "#1C1C1E", color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "16px 20px",
                display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
                boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
                fontFamily: "var(--font)", backdropFilter: "blur(20px)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ background: "var(--color-primary)", borderRadius: "14px", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#000" }}>
                  <FiShoppingCart />
                </div>
                <div style={{ textAlign: "left" }}>
                   <div style={{ fontWeight: 800, fontSize: "16px" }}>Voir le panier</div>
                   <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{totalItems} plat(s) au total</div>
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: "18px", color: "var(--color-primary)" }}>{formatPrice(totalAmount)}</div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button pour voir les commandes en cours */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setShowOrdersModal(true)}
            style={{
              position: "fixed", bottom: totalItems > 0 ? 104 : 24, right: 24, zIndex: 40,
              width: 56, height: 56, borderRadius: "50%", background: "#fff", color: "#000",
              border: "none", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 10px 24px rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 24
            }}
          >
            🧾
            {/* Badge */}
            <div style={{
              position: "absolute", top: -4, right: -4, background: "var(--color-primary)", color: "#000",
              width: 22, height: 22, borderRadius: "50%", fontWeight: 800, fontSize: 12,
              display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #121214"
            }}>
              {activeOrders.length}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal Bottom-Sheet pour les commandes en cours */}
      <AnimatePresence>
        {showOrdersModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowOrdersModal(false)}
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 60, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1C1C1E", borderTopLeftRadius: "32px", borderTopRightRadius: "32px", padding: "24px 24px 40px", zIndex: 70, borderTop: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 -20px 40px rgba(0,0,0,0.5)" }}
            >
              <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 4, margin: "0 auto 24px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Plats en préparation</h2>
                <button onClick={() => setShowOrdersModal(false)} style={{ background: "#2C2C2E", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "60vh", overflowY: "auto" }}>
                {activeOrders.map(order => {
                  const totalOrderItems = order.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
                  return (
                    <div key={order.id} onClick={() => navigate(`/confirmation/${order.id}`)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "20px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "14px", background: order.status === "PENDING" ? "rgba(243, 156, 18, 0.2)" : order.status === "VALIDATED" ? "rgba(46, 204, 113, 0.2)" : "rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                           {order.status === "PENDING" ? "⏳" : order.status === "VALIDATED" ? "✨" : "🧾"}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                           <span style={{ fontSize: 16, fontWeight: 700 }}>Ticket #{order.id.slice(0,4).toUpperCase()}</span>
                           <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{totalOrderItems} article(s)</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: order.status === "PENDING" ? "#F39C12" : order.status === "VALIDATED" ? "#2ECC71" : "#fff", background: order.status === "PENDING" ? "rgba(243, 156, 18, 0.1)" : order.status === "VALIDATED" ? "rgba(46, 204, 113, 0.1)" : "rgba(255, 255, 255, 0.1)", padding: "6px 12px", borderRadius: "100px" }}>
                        {order.status === "PENDING" ? "En attente" : order.status === "VALIDATED" ? "Validé" : "Payé"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

// ============================================================
// CART PAGE (Style Panier Latéral/Tiroir)
// ============================================================
export function CartPage() {
  const navigate     = useNavigate();
  const [loading, setLoading] = useState(false);

  const items       = useCartStore((s) => s.items);
  const increaseQty = useCartStore((s) => s.increaseQty);
  const decreaseQty = useCartStore((s) => s.decreaseQty);
  const clearCart   = useCartStore((s) => s.clearCart);
  const totalAmount = useCartStore((s) => s.totalAmount());
  const totalItems  = useCartStore((s) => s.totalItems());
  const table       = useTableStore((s) => s.table);

  const handleOrder = async () => {
    try {
      setLoading(true);
      const itemsPayload = items.map((i: any) => ({ productId: i.productId, quantity: i.quantity }));
      
      // 1. Chercher s'il y a déjà une commande en cours (PENDING ou VALIDATED)
      const existingOrders = await OrderApi.list();
      const activeOrder = existingOrders.find((o: any) => o.status === "PENDING" || o.status === "VALIDATED");

      let order;
      if (activeOrder) {
        // 2. Ajouter à la commande existante
        order = await OrderApi.addItem(activeOrder.id, itemsPayload);
      } else {
        // 3. Créer une nouvelle commande
        order = await OrderApi.create(itemsPayload);
      }
      
      clearCart();
      navigate(`/confirmation/${order.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Erreur lors de la commande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#121214", display: "flex", flexDirection: "column", color: "#fff", fontFamily: "var(--font)" }}>
      {/* Header */}
      <div style={{ padding: "24px", display: "flex", alignItems: "center", gap: 16, background: "rgba(28,28,30,0.8)", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(20px)" }}>
        <button onClick={() => navigate("/menu")} style={{ background: "#2C2C2E", borderRadius: "12px", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", border: "none", color: "#fff", cursor: "pointer" }}>
          <FiChevronLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>Mon Panier</h1>
          {table && <div style={{ fontSize: "12px", color: "var(--color-primary)", fontWeight: 700 }}>TABLE : {table.name}</div>}
        </div>
      </div>

      <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 100 }}>
            <div style={{ fontSize: 64, opacity: 0.5, marginBottom: 20 }}>🛒</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Votre panier est vide</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>Découvrez nos plats dans le menu et ajoutez-les ici.</p>
            <Button onClick={() => navigate("/menu")} size="lg">Retour au Menu</Button>
          </div>
        ) : (
          <>
            <div style={{ background: "#1C1C1E", borderRadius: "24px", padding: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              {items.map((item, i) => (
                <div key={item.productId} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "16px", background: "#2A2A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, overflow: "hidden" }}>
                    {item.imageUrl ? (
                      <img src={formatImageUrl(item.imageUrl)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      getEmojiForName(item.name)
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: 4, lineHeight: 1.2 }}>{item.name}</div>
                    <div style={{ fontWeight: 800, color: "var(--color-primary)" }}>{formatPrice(item.price)}</div>
                  </div>
                  {/* Reglage Quantité style Pilule */}
                  <div style={{ display: "flex", alignItems: "center", background: "#000", borderRadius: "100px", padding: "4px" }}>
                    <button onClick={() => decreaseQty(item.productId)} style={{ width: 32, height: 32, borderRadius: "50%", background: "#2C2C2E", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><FiMinus size={14}/></button>
                    <span style={{ minWidth: 32, textAlign: "center", fontWeight: 800, fontSize: 14 }}>{item.quantity}</span>
                    <button onClick={() => increaseQty(item.productId)} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary)", border: "none", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><FiPlus size={14}/></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resume de la commande */}
            <div style={{ marginTop: "auto", background: "#1C1C1E", borderRadius: "24px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 15, color: "rgba(255,255,255,0.6)" }}>
                 <span>Sous-total ({totalItems} items)</span>
                 <span>{formatPrice(totalAmount)}</span>
               </div>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, fontSize: 15, color: "rgba(255,255,255,0.6)" }}>
                 <span>Service à Table</span>
                 <span style={{ color: "var(--color-success)" }}>Inclus</span>
               </div>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20, borderTop: "1px dashed rgba(255,255,255,0.1)", marginBottom: 24 }}>
                 <span style={{ fontWeight: 700, fontSize: 18 }}>TOTAL</span>
                 <span style={{ fontWeight: 800, fontSize: 24, color: "var(--color-primary)" }}>{formatPrice(totalAmount)}</span>
               </div>

               <motion.button
                 whileTap={{ scale: 0.98 }}
                 onClick={handleOrder}
                 disabled={loading}
                 style={{
                   width: "100%", background: "var(--color-primary)", color: "#000", border: "none", borderRadius: "100px",
                   padding: "18px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 20px rgba(255,107,0,0.3)"
                 }}
               >
                 {loading ? "Envoi..." : "Confirmer la Commande"}
               </motion.button>
               <button onClick={clearCart} style={{ width: "100%", background: "transparent", color: "rgba(255,255,255,0.4)", border: "none", margin: "16px 0 0", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                  Vider le panier
               </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CONFIRMATION PAGE
// ============================================================

const STATUS_INFO: Record<string, { emoji: string; title: string; subtitle: string; color: string }> = {
  PENDING:   { emoji: "⏳", title: "Commande envoyée !", subtitle: "En attente de validation par le personnel.", color: "#F39C12" },
  VALIDATED: { emoji: "✨", title: "Validée !", subtitle: "Votre commande est en cours de préparation.", color: "#2ECC71" },
  PAID:      { emoji: "🧾", title: "Réglée", subtitle: "Merci de votre visite et à bientôt !", color: "#95A5A6" },
  REJECTED:  { emoji: "🚫", title: "Rejetée", subtitle: "Cette commande a été refusée ou annulée.", color: "#FF3B30" },
};

export function ConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate    = useNavigate();
  const [order,  setOrder]  = useState<Order | null>(null);
  const clearSession = useTableStore((s) => s.clearSession);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try { setOrder(await OrderApi.getById(orderId)); }
      catch { console.error("Erreur de récupération"); }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 4000); // Polling 4s
    return () => clearInterval(interval);
  }, [orderId]);


  const info = STATUS_INFO[order?.status ?? "PENDING"];

  return (
    <div style={{ minHeight: "100vh", background: "#121214", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, color: "#fff", fontFamily: "var(--font)" }}>
      {/* Animation de fond */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, height: 400, background: `radial-gradient(circle, ${info?.color || 'var(--color-primary)'}20 0%, transparent 70%)`, filter: "blur(50px)", zIndex: 0 }} />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ textAlign: "center", zIndex: 1, marginBottom: 40 }}
      >
        <div style={{ fontSize: 80, marginBottom: 16, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))" }}>{info.emoji}</div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: info.color, margin: "0 0 12px" }}>{info.title}</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, maxWidth: 280, margin: "0 auto" }}>{info.subtitle}</p>
      </motion.div>

      {/* Ticket de caisse recréé en mode Sombre */}
      {order && (
        <motion.div
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ width: "100%", maxWidth: 360, background: "#1C1C1E", borderRadius: "24px", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)", zIndex: 1 }}
        >
          <div style={{ textAlign: "center", borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: 16, marginBottom: 16 }}>
             <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: 1 }}>TICKET DE COMMANDE</h2>
             <div style={{ fontSize: 12, color: "var(--color-primary)", marginTop: 4, fontWeight: 700 }}>TABLE {order.table?.name}</div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {order.items?.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>{item.quantity}x</span>
                  <span>{item.product?.name}</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</span>
                  {order?.status === "PENDING" && (
                    <button
                      onClick={async () => {
                        try {
                          await OrderApi.removeItem(order.id, item.id);
                          setOrder(await OrderApi.getById(order.id));
                        } catch (e: any) { alert("Erreur lors de la suppression de l'article."); }
                      }}
                      style={{ background: "rgba(255,59,48,0.2)", color: "#FF3B30", border: "none", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}
                    >
                      ✕
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>TOTAL À PAYER</strong>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--color-primary)" }}>{formatPrice(order.totalAmount)}</span>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 360, marginTop: 32, zIndex: 1 }}>
        {order?.status !== "PAID" && order?.status !== "REJECTED" && (
          <>
            <button
              onClick={() => navigate("/menu")}
              style={{ width: "100%", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "100px", padding: "16px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
            >
              + Ajouter d'autres articles
            </button>
            
            {order?.status === "PENDING" && (
              <button
                onClick={async () => {
                  if (window.confirm("Voulez-vous vraiment annuler toute la commande ?")) {
                    try {
                      await OrderApi.cancel(order.id);
                      setOrder(await OrderApi.getById(order.id));
                    } catch (e: any) {
                      alert(e.response?.data?.message || "Erreur lors de l'annulation");
                    }
                  }
                }}
                style={{ width: "100%", background: "rgba(255,59,48,0.1)", color: "#FF3B30", border: "1px solid rgba(255,59,48,0.2)", borderRadius: "100px", padding: "16px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
              >
                Annuler la commande
              </button>
            )}
          </>
        )}

        {(order?.status === "PAID" || order?.status === "REJECTED") && (
          <button
            onClick={() => { clearSession(); navigate("/scan"); }}
            style={{ width: "100%", background: "var(--color-primary)", color: "#000", border: "none", borderRadius: "100px", padding: "16px", fontWeight: 800, fontSize: 15, cursor: "pointer" }}
          >
            Nouvelle Commande
          </button>
        )}
      </div>
    </div>
  );
}