import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiBell, FiCheckCircle, FiInbox } from "react-icons/fi";
import { NotificationApi } from "../api";
import type { Notification } from "../api";
import { NotificationCard } from "./NotificationCard";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUnread?: (count: number) => void;
}

export function NotificationDrawer({ isOpen, onClose, onUpdateUnread }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await NotificationApi.list();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      onUpdateUnread?.(res.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleRead = async (id: string) => {
    try {
      await NotificationApi.markRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      onUpdateUnread?.(unreadCount - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await NotificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      onUpdateUnread?.(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const notif = notifications.find(n => n.id === id);
      await NotificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        onUpdateUnread?.(unreadCount - 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
              zIndex: 1000
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed", right: 0, top: 0, bottom: 0,
              width: "100%", maxWidth: "420px",
              background: "var(--color-bg)",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
              zIndex: 1001,
              display: "flex", flexDirection: "column",
              borderLeft: "1px solid var(--color-border-light)"
            }}
          >
            {/* Header */}
            <div style={{
              padding: "24px",
              borderBottom: "1px solid var(--color-border-light)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--color-surface)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: "12px", 
                  background: "var(--color-bg)", display: "flex", 
                  alignItems: "center", justifyContent: "center", color: "var(--color-text-primary)"
                }}>
                  <FiBell style={{ fontSize: 20 }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Notifications</h2>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-tertiary)", fontWeight: 600 }}>
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                style={{ 
                  width: 36, height: 36, borderRadius: "50%", 
                  border: "none", background: "var(--color-bg)", 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--color-text-secondary)"
                }}
              >
                <FiX />
              </button>
            </div>

            {/* List */}
            <div style={{ 
              flex: 1, overflowY: "auto", padding: "20px", 
              display: "flex", flexDirection: "column", gap: 12 
            }}>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAll}
                  style={{
                    padding: "8px 16px", borderRadius: "10px", 
                    border: "1px solid var(--color-border-light)",
                    background: "var(--color-surface)", color: "var(--color-text-secondary)",
                    fontSize: "12px", fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-end",
                    marginBottom: 8
                  }}
                >
                  <FiCheckCircle /> Tout marquer comme lu
                </button>
              )}

              {loading && notifications.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-tertiary)" }}>
                  Chargement...
                </div>
              ) : notifications.length > 0 ? (
                notifications.map(n => (
                  <NotificationCard key={n.id} notification={n} onRead={handleRead} onDelete={handleDelete} />
                ))
              ) : (
                <div style={{ 
                  flex: 1, display: "flex", flexDirection: "column", 
                  alignItems: "center", justifyContent: "center", gap: 16,
                  opacity: 0.5, paddingBottom: 60
                }}>
                  <FiInbox style={{ fontSize: 48 }} />
                  <p style={{ fontWeight: 600 }}>Aucune notification</p>
                </div>
              )}
            </div>

            {/* Footer / Cron Result Info */}
            <div style={{ 
              padding: "20px", borderTop: "1px solid var(--color-border-light)",
              background: "var(--color-surface)", fontSize: "12px",
              color: "var(--color-text-tertiary)", textAlign: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                Système de surveillance actif
              </div>
              Tâches automatiques (Cron) terminées aujourd'hui.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
