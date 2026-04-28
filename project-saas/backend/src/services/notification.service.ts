// =============================================================
//  NOTIFICATION SERVICE
//
//  Les notifications sont créées automatiquement par :
//  - ProductService.adjustStock() → stock faible
//  - SubscriptionService         → changement de plan, expiration
//  - CronJob                     → expiration imminente
//
//  L'utilisateur peut les lire et les marquer comme lues.
//  Sur plan FREE → pas de notifications (limites du plan)
// =============================================================

import prisma from "../lib/prisma";
import { getPlanLimits } from "../lib/plan-limits";
import type { createNotificationInput, markNotificationReadInput } from "../validators/notification.validator";

export class NotificationService {

  // ── Lister les notifications du tenant ────────────────────
  async list(tenantId: string, onlyUnread = false) {
    // Vérifier si le plan autorise les notifications
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      select: { plan: true },
    });

    const limits = getPlanLimits(subscription?.plan ?? "FREE");
    const isRestricted = limits?.notifications === 0;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          tenantId,
          ...(onlyUnread && { isRead: false }),
        },
        orderBy: { createdAt: "desc" },
        take: 50, // 50 dernières
      }),
      prisma.notification.count({
        where: { tenantId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount, planRestricted: isRestricted };
  }

  // ── Marquer une notification comme lue ────────────────────
  async markAsRead(tenantId: string, notificationId: markNotificationReadInput) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId.id, tenantId },
    });
    if (!notification) throw new Error("NOTIFICATION_NOT_FOUND");

    return prisma.notification.update({
      where: { id: notificationId.id },
      data:  { isRead: true },
    });
  }

  // ── Marquer toutes comme lues ─────────────────────────────
  async markAllAsRead(tenantId: string) {
    const result = await prisma.notification.updateMany({
      where: { tenantId, isRead: false },
      data:  { isRead: true },
    });
    return { updated: result.count };
  }

  // ── Supprimer les notifications lues (nettoyage) ──────────
  async deleteRead(tenantId: string) {
    const result = await prisma.notification.deleteMany({
      where: { tenantId, isRead: true },
    });
    return { deleted: result.count };
  }

  // ── Créer une notification manuellement (usage interne) ───
  // Appelée par les autres services : ProductService, CronJob, etc.
  async create(tenantId: string, data: createNotificationInput) {
    // Ne pas créer si le plan FREE ne supporte pas les notifs
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      select: { plan: true },
    });
    // const limits = getPlanLimits(subscription?.plan ?? "FREE");
    // if (limits?.notifications === 0) return null; // Silencieux

    return prisma.notification.create({
      data: { tenantId, ...data } as any,
    });
  }

  // ── Notification d'expiration imminente ───────────────────
  // Appelée par le cron job — prévient 7 jours avant expiration
  async notifyExpirationSoon(tenantId: string, daysLeft: number) {
    return prisma.notification.create({
      data: {
        tenantId,
        title:   "Abonnement bientôt expiré",
        message: `Votre abonnement expire dans ${daysLeft} jour(s). Renouvelez maintenant pour éviter une interruption de service.`,
      },
    });
  }
  // ── Supprimer une notification ───────────────────────────
  async delete(tenantId: string, id: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, tenantId },
    });
    if (!notification) throw new Error("NOTIFICATION_NOT_FOUND");

    return prisma.notification.delete({
      where: { id },
    });
  }
};