import { FiAlertTriangle, FiInfo, FiServer, FiCheckCircle, FiTrash2 } from "react-icons/fi";
import { motion } from "framer-motion";
import type { Notification } from "../api";

function timeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

interface Props {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationCard({ notification, onRead, onDelete }: Props) {
  const getIcon = () => {
    switch (notification.category) {
      case "WARNING": return <FiAlertTriangle style={{ color: "#f59e0b" }} />;
      case "SYSTEM":  return <FiServer style={{ color: "#6366f1" }} />;
      case "SUCCESS": return <FiCheckCircle style={{ color: "#10b981" }} />;
      default:        return <FiInfo style={{ color: "#3b82f6" }} />;
    }
  };

  const getBorderColor = () => {
    switch (notification.category) {
      case "WARNING": return "#f59e0b44";
      case "SYSTEM":  return "#6366f144";
      case "SUCCESS": return "#10b98144";
      default:        return "#3b82f644";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={() => !notification.isRead && onRead(notification.id)}
      style={{
        padding: "16px",
        borderRadius: "16px",
        background: "var(--color-surface)",
        border: `1px solid ${notification.isRead ? "var(--color-border-light)" : getBorderColor()}`,
        cursor: notification.isRead ? "default" : "pointer",
        position: "relative",
        boxShadow: notification.isRead ? "none" : "0 4px 12px rgba(0,0,0,0.03)",
        transition: "all 0.2s ease",
        display: "flex",
        gap: 14,
        opacity: notification.isRead ? 0.7 : 1
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: "12px",
        background: "var(--color-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0
      }}>
        {getIcon()}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {notification.title}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!notification.isRead && (
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
              style={{ background: "transparent", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer", display: "flex", padding: 4 }}
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>
        <p style={{ margin: "4px 0 8px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
          {notification.message}
        </p>
        <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontWeight: 600 }}>
          {timeAgo(notification.createdAt)}
        </span>
      </div>
    </motion.div>

  );
}
