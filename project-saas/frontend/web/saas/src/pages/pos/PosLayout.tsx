import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { FiGrid, FiMonitor, FiCreditCard, FiPlus, FiDollarSign } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ExpenseModal } from "../../components/ExpenseModal";
import { showToast } from "../../components/ui";

export function PosLayout() {
  const navigate  = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showExpense, setShowExpense] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#121214" }}>

      {/* Contenu de la page en cours — avec padding bottom sur mobile */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", paddingBottom: isMobile ? 72 : 0 }}>
        <Outlet />
      </div>

      {/* ─── Bottom Navigation Bar — Mobile uniquement ─── */}
      {isMobile && (
        <nav style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          height: 72,
          background: "rgba(18, 18, 20, 0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 8px",
          zIndex: 2000,
          boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
        }}>

          {/* Tables */}
          <NavLink to="/pos/tables" style={{ textDecoration: "none", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0", cursor: "pointer" }}>
            {({ isActive }) => (
              <>
                <motion.div animate={{ scale: isActive ? 1.15 : 1 }} style={{ color: isActive ? "var(--color-primary)" : "rgba(255,255,255,0.45)", display: "flex" }}>
                  <FiGrid size={22} />
                </motion.div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: isActive ? "var(--color-primary)" : "rgba(255,255,255,0.45)" }}>Tables</span>
              </>
            )}
          </NavLink>

          {/* Suivi */}
          <NavLink to="/pos/kitchen" style={{ textDecoration: "none", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0", cursor: "pointer" }}>
            {({ isActive }) => (
              <>
                <motion.div animate={{ scale: isActive ? 1.15 : 1 }} style={{ color: isActive ? "var(--color-primary)" : "rgba(255,255,255,0.45)", display: "flex" }}>
                  <FiMonitor size={22} />
                </motion.div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: isActive ? "var(--color-primary)" : "rgba(255,255,255,0.45)" }}>Suivi</span>
              </>
            )}
          </NavLink>

          {/* Vente Directe — Bouton central mis en avant */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "2px 0" }}>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate("/pos/order/direct", { state: { tableName: "Vente Directe" } })}
              style={{
                width: 50, height: 50, borderRadius: "16px",
                background: "var(--color-primary)",
                border: "none", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(255,107,0,0.45)",
                marginTop: -8,
              }}
            >
              <FiPlus size={26} />
            </motion.button>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Direct</span>
          </div>

          {/* Dépense */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0", cursor: "pointer" }}
            onClick={() => setShowExpense(true)}
          >
            <div style={{ color: "rgba(255,255,255,0.45)", display: "flex" }}>
              <FiDollarSign size={22} />
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>Dépense</span>
          </div>

          {/* Caisse */}
          <NavLink to="/pos/cycle" style={{ textDecoration: "none", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0", cursor: "pointer" }}>
            {({ isActive }) => (
              <>
                <motion.div animate={{ scale: isActive ? 1.15 : 1 }} style={{ color: isActive ? "var(--color-primary)" : "rgba(255,255,255,0.45)", display: "flex" }}>
                  <FiCreditCard size={22} />
                </motion.div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: isActive ? "var(--color-primary)" : "rgba(255,255,255,0.45)" }}>Caisse</span>
              </>
            )}
          </NavLink>

        </nav>
      )}

      {/* Modale dépense — accessible depuis la bottom nav */}
      <AnimatePresence>
        {showExpense && (
          <ExpenseModal
            isOpen={showExpense}
            onClose={() => setShowExpense(false)}
            onSuccess={() => {
              showToast("Dépense enregistrée", "success");
              setShowExpense(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
