// =============================================================
//  src/screens/admin/NotificationsScreen.tsx
//  Centre de notifications — Premium Glassmorphism UI
//  Réplique la logique du NotificationDrawer web
// =============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, Alert, Platform,
} from "react-native";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { AdminStackParams } from "../../navigation";
import { NotificationApi, Notification } from "../../api";
import Icon from "react-native-vector-icons/Feather";
import Animated, { FadeInDown, FadeInRight, Layout, SlideOutLeft } from "react-native-reanimated";

type Props = DrawerScreenProps<AdminStackParams, "Notifications">;

// ── Helpers ────────────────────────────────────────────────
function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

function getCategoryConfig(category?: string) {
  switch (category) {
    case "WARNING": return { icon: "alert-triangle", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" };
    case "SYSTEM":  return { icon: "server",         color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)" };
    case "SUCCESS": return { icon: "check-circle",   color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" };
    default:        return { icon: "info",           color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)" };
  }
}

// ── Notification Card Component ────────────────────────────
function NotificationCard({ notification, index, onRead, onDelete }: {
  notification: Notification;
  index: number;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = getCategoryConfig(notification.category);
  const isUnread = !notification.isRead;

  return (
    <Animated.View
      layout={Layout.springify()}
      entering={FadeInDown.delay(index * 60).duration(400)}
      exiting={SlideOutLeft.duration(300)}
    >
      <TouchableOpacity
        style={[
          styles.card,
          isUnread && { borderColor: cfg.border, backgroundColor: `${cfg.color}08` },
        ]}
        onPress={() => isUnread && onRead(notification.id)}
        activeOpacity={isUnread ? 0.7 : 1}
      >
        {/* Icon */}
        <View style={[styles.cardIcon, { backgroundColor: cfg.bg }]}>
          <Icon name={cfg.icon} size={20} color={cfg.color} />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, !isUnread && { opacity: 0.6 }]} numberOfLines={1}>
              {notification.title}
            </Text>
            <View style={styles.cardActions}>
              {isUnread && <View style={styles.unreadDot} />}
              <TouchableOpacity
                onPress={() => onDelete(notification.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="trash-2" size={14} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.cardMessage, !isUnread && { opacity: 0.5 }]} numberOfLines={2}>
            {notification.message}
          </Text>

          <View style={styles.cardFooter}>
            <Icon name="clock" size={10} color="rgba(255,255,255,0.3)" />
            <Text style={styles.cardTime}>{timeAgo(notification.createdAt)}</Text>
            {notification.category && (
              <View style={[styles.categoryBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.categoryBadgeText, { color: cfg.color }]}>
                  {notification.category}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ────────────────────────────────────────────
export function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await NotificationApi.list();
      const list = res.notifications ?? res ?? [];
      setNotifications(Array.isArray(list) ? list : []);
      setUnreadCount(res.unreadCount ?? list.filter((n: Notification) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleRead = async (id: string) => {
    try {
      await NotificationApi.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await NotificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
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
      }
    } catch (err) {
      Alert.alert("Erreur", "Impossible de supprimer la notification");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background blob */}
      <View style={[styles.bgBlob, { top: -100, right: -100, backgroundColor: "rgba(99,102,241,0.12)" }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).openDrawer()} style={styles.backButton}>
          <Icon name="menu" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est à jour"}
          </Text>
        </View>
        <View style={styles.bellBox}>
          <Icon name="bell" size={20} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Mark all as read */}
      {unreadCount > 0 && (
        <Animated.View entering={FadeInRight.duration(400)}>
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll}>
            <Icon name="check-circle" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Notification list */}
      {loading ? (
        <View style={styles.center}>
          <Text style={{ color: "rgba(255,255,255,0.5)" }}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
              tintColor="#6366f1"
            />
          }
          renderItem={({ item, index }) => (
            <NotificationCard
              notification={item}
              index={index}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Icon name="inbox" size={48} color="rgba(255,255,255,0.15)" />
              </View>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptySubtitle}>
                Vous serez notifié des événements importants ici
              </Text>
            </View>
          }
        />
      )}

      {/* Footer status */}
      <View style={styles.footer}>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>Système de surveillance actif</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c", position: "relative" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  bgBlob: { position: "absolute", width: 350, height: 350, borderRadius: 175, filter: [{ blur: 90 }], zIndex: 0 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 60 : 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", zIndex: 1,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  headerCenter: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "600", marginTop: 2 },
  bellBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", position: "relative" },
  bellBadge: { position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" },
  bellBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },

  markAllBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-end",
    paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 20, marginTop: 16,
    borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  markAllText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.6)" },

  list: { padding: 20, paddingBottom: 100, gap: 12 },

  // ── Card ──
  card: {
    flexDirection: "row", gap: 14, padding: 16, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#fff", flex: 1, marginRight: 8 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" },

  cardMessage: { fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 19, marginBottom: 8 },

  cardFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTime: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "600" },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  categoryBadgeText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

  // ── Empty ──
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyIconBox: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", maxWidth: 260 },

  // ── Footer ──
  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  footerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" },
  footerText: { fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: "600" },
});
