// src/pages/admin/AdminLayout.tsx

import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores";
import { FiPieChart, FiBookOpen, FiUsers, FiMap, FiBarChart2, FiCreditCard, FiMenu, FiLogOut, FiBell, FiShield } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationDrawer } from "../../components/NotificationDrawer";
import { NotificationApi } from "../../api";
import { showToast } from "../../components/ui";

const NAV_ITEMS = [
  { to: "/dashboard",     icon: FiPieChart,  label: "Tableau de bord", adminOnly: true, showInBottom: true },
  { to: "/menu-manager",  icon: FiBookOpen,  label: "Menu",            adminOnly: true, showInBottom: true },
  { to: "/staff",         icon: FiUsers,     label: "Équipe",          adminOnly: true, showInBottom: true },
  { to: "/reports",       icon: FiBarChart2, label: "Rapports",        adminOnly: true, showInBottom: false },
  { to: "/tables-manager",icon: FiMap,       label: "Tables",          adminOnly: true, showInBottom: true },
  { to: "/subscription",  icon: FiCreditCard,label: "Abonnement",      adminOnly: true, showInBottom: false },
  { to: "/super-admin",   icon: FiShield,     label: "Super Admin",   superOnly: true, showInBottom: false },
];

export function AdminLayout() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const user       = useAuthStore((s) => s.user);
  const tenant     = useAuthStore((s) => s.tenant);
  const logout     = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const fetchNotifs = async () => {
    try {
      const res = await NotificationApi.list();
      const list = res.notifications || [];
      const unread = list.filter((n: any) => !n.isRead);
      setNotifCount(res.unreadCount || unread.length);

      // On affiche un toast pour CHAQUE notification non lue qu'on n'a pas encore vue
      // On stocke les IDs déjà affichés pour éviter les doublons au prochain poll
      unread.forEach((n: any) => {
        if (!seenNotifs.has(n.id)) {
          showToast(`${n.title}: ${n.message}`, "success");
          seenNotifs.add(n.id);
        }
      });
    } catch (e) {}
  };

  const [seenNotifs] = useState(new Set<string>());

  React.useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const Sidebar = () => (
    <nav className="sidebar" style={{
      background: "var(--color-surface)",
      borderRight: "1px solid var(--color-border-light)",
      display: "flex", flexDirection: "column", height: "100%",
      transition: "width 0.3s ease",
      overflow: "hidden"
    }}>
      {/* Logo Area */}
      <div style={{ padding: "32px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: "8px", 
            background: "var(--color-primary)", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            color: "#fff", fontSize: 18, fontWeight: 'bold', flexShrink: 0
          }}>
            {user?.role === "SUPERADMIN" ? <FiShield size={18} /> : (tenant?.name?.charAt(0).toUpperCase() ?? "S")}
          </div>
          <div className="hide-tablet" style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.5px", color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>
              {user?.role === "SUPERADMIN" ? "System Control" : (tenant?.name ?? "SaasCa.")}
            </div>
          </div>
        </div>
      </div>

      <div className="hide-tablet" style={{ padding: "0 24px", fontSize: "10px", fontWeight: 700, letterSpacing: "1px", color: "var(--color-text-tertiary)", marginTop: 8, marginBottom: 12 }}>
        MENU
      </div>

      <div style={{ flex: 1, padding: "0 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.filter(item => {
          if (user?.role === "SUPERADMIN") return item.superOnly;
          return !item.superOnly;
        }).map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              style={{ textDecoration: "none" }}
              title={item.label}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 14px", borderRadius: "12px",
                  fontWeight: 600, fontSize: "14px",
                  background: isActive ? "var(--color-text-primary)" : "transparent",
                  color: isActive ? "var(--color-surface)" : "var(--color-text-secondary)",
                  transition: "color 0.2s, background 0.2s",
                  justifyContent: "flex-start"
                }}
                className="sidebar-item"
              >
                <item.icon style={{ fontSize: 20, flexShrink: 0, color: isActive ? "var(--color-surface)" : "var(--color-text-tertiary)" }} />
                <span className="hide-tablet" style={{ whiteSpace: "nowrap" }}>{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>

      {/* Footer / User Profile */}
      <div style={{ padding: "20px 16px", borderTop: "1px solid var(--color-border-light)", background: "rgba(255,255,255,0.4)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar avec initiale de l'établissement */}
            <div style={{
              width: 48, height: 48, borderRadius: "16px",
              background: "linear-gradient(135deg, var(--color-primary), #FF8C5A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: "20px", color: "#fff", flexShrink: 0,
              boxShadow: "0 8px 16px rgba(255, 107, 53, 0.25)"
            }}>
              {tenant?.name?.charAt(0).toUpperCase() ?? "S"}
            </div>

            <div className="hide-tablet" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {tenant?.name ?? "Mon Établissement"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 600 }}>
                {user?.email}
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, background: "var(--color-text-primary)", color: "#fff", borderColor: "var(--color-text-primary)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            style={{ 
              width: "100%", padding: "12px", borderRadius: "12px", 
              background: "transparent", color: "var(--color-text-primary)", 
              border: "2px solid var(--color-text-primary)", cursor: "pointer", 
              fontSize: "14px", fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "all 0.2s ease"
            }}
          >
            <FiLogOut size={18} />
            <span className="hide-tablet">Déconnexion</span>
          </motion.button>
        </div>
      </div>
    </nav>
  );

  const BottomNav = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    React.useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (mobileOpen || !isMobile) return null; // Mutual exclusion logic
    
    return (
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: 70, background: "rgba(255, 255, 255, 0.8)", 
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--color-border-light)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "0 10px", zIndex: 100,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.05)"
      }}>
        {NAV_ITEMS.filter(i => i.showInBottom && !i.superOnly).map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink key={item.to} to={item.to} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <motion.div
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  color: isActive ? "var(--color-primary)" : "var(--color-text-tertiary)"
                }}
                style={{ fontSize: 22, display: "flex" }}
              >
                <item.icon />
              </motion.div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: isActive ? "var(--color-primary)" : "var(--color-text-tertiary)" }}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    );
  };

  const isMobileView = window.innerWidth < 768; // Simple check for initial render

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-bg)" }}>
      {/* Sidebar desktop */}
      <div className="hide-mobile" style={{ flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Sidebar mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}
          >
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              style={{ flex: "0 0 260px" }}
            >
              <Sidebar />
            </motion.div>
            <div style={{ flex: 1, background: "rgba(0,0,0,.4)" }} onClick={() => setMobileOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu principal */}
      <div 
        style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          overflow: "hidden", 
          paddingBottom: (mobileOpen || !isMobileView) ? 0 : 70 
        }} 
        className="main-content"
      >
        
        {/* Universal Header (Desktop & Mobile) */}
        <header style={{ 
          background: "var(--color-surface)", 
          borderBottom: "1px solid var(--color-border-light)", 
          padding: "12px 24px", 
          display: "flex", alignItems: "center", justifyContent: "space-between",
          zIndex: 50
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button 
              className="hide-tablet-desktop"
              onClick={() => setMobileOpen(true)} 
              style={{ color: "var(--color-text-primary)", fontSize: 24, display: "flex", border: "none", background: "none", cursor: "pointer" }}
            >
              <FiMenu />
            </button>
            <h1 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "var(--color-text-primary)" }}>
              {location.pathname === "/dashboard" ? "Tableau de Bord" : 
               NAV_ITEMS.find(i => location.pathname.startsWith(i.to))?.label ?? "Administration"}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {user?.role !== "SUPERADMIN" && (
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotifOpen(true)}
                style={{ 
                  position: "relative",
                  background: "var(--color-bg)", border: "1px solid var(--color-border-light)",
                  width: 36, height: 36, borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--color-text-secondary)"
                }}
              >
                <FiBell style={{ fontSize: 18 }} />
                {notifCount > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -4,
                    minWidth: 16, height: 16, borderRadius: "8px",
                    background: "#ef4444", color: "#fff",
                    fontSize: "9px", fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 4px", border: "2px solid var(--color-surface)"
                  }}>
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </motion.button>
            )}
          </div>
        </header>

        <motion.div 
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
          <Outlet />
        </motion.div>
      </div>
      <BottomNav />
      <NotificationDrawer 
        isOpen={notifOpen} 
        onClose={() => setNotifOpen(false)} 
        onUpdateUnread={setNotifCount}
      />
    </div>
  );
}