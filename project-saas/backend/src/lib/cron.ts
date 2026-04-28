// =============================================================
//  LIB/CRON.TS — Jobs planifiés
//
//  Tourne en arrière-plan sur le serveur.
//  S'exécute chaque nuit à minuit (00:00).
//
//  Ce qu'il fait :
//  1. Trouve tous les abonnements qui expirent dans 7 jours → notifie
//  2. Trouve tous les abonnements expirés → suspend le tenant
//  3. Trouve les tenants avec cycles ouverts depuis +24h → alerte
//
//  Installation : npm install node-cron
// =============================================================

import cron from "node-cron";
import  prisma  from "./prisma";
import { SubscriptionService } from "../services/subscription.service";
import { NotificationService } from "../services/notification.service";

// ── Job principal ─────────────────────────────────────────────
// Syntaxe cron : "0 0 * * *" = chaque jour à minuit

const subscriptionService = new SubscriptionService();
const notificationService = new NotificationService();

export function startCronJobs() {
  console.log("Cron jobs démarrés");

  // ── Vérification des abonnements — chaque nuit à minuit ───
  cron.schedule("0 0 * * *", async () => {
    console.log(`[CRON] ${new Date().toISOString()} — Vérification des abonnements`);

    try {
      const now = new Date();

      // 1. Abonnements qui expirent dans 7 jours ou moins → notifier
      const expiringSoon = await prisma.subscription.findMany({
        where: {
          status:    "ACTIVE",
          expiresAt: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 jours
          },
        },
        select: { tenantId: true, expiresAt: true },
      });

      for (const sub of expiringSoon) {
        const daysLeft = Math.ceil(
          (sub.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        // Notifier seulement à J-7, J-3 et J-1 pour ne pas spammer
        if ([7, 3, 1].includes(daysLeft)) {
          await notificationService.notifyExpirationSoon(sub.tenantId, daysLeft);
          console.log(`[CRON] Tenant ${sub.tenantId} notifié — expiration dans ${daysLeft} jour(s)`);
        }
      }

      // 2. Abonnements expirés → suspendre
      const expired = await prisma.subscription.findMany({
        where: {
          status:    "ACTIVE",
          expiresAt: { lt: now }, // Passé
        },
        select: { tenantId: true },
      });

      for (const sub of expired) {
        await subscriptionService.expire(sub.tenantId);
        console.log(`[CRON] Tenant ${sub.tenantId} expiré et suspendu`);
      }

      console.log(`[CRON] Terminé — ${expiringSoon.length} notifications, ${expired.length} suspensions`);

    } catch (error) {
      console.error("[CRON] Erreur :", error);
    }
  });

  // ── Alerte cycle oublié — chaque jour à 23h ───────────────
  // Si un caissier a oublié de fermer la caisse, on notifie
  cron.schedule("0 23 * * *", async () => {
    console.log(`[CRON] Vérification des cycles ouverts`);

    try {
      const threshold = new Date(Date.now() - 20 * 60 * 60 * 1000); // -20h

      const forgottenCycles = await prisma.cycle.findMany({
        where: {
          status:   "OPEN",
          openedAt: { lt: threshold }, // Ouvert depuis plus de 20h
        },
        select: { tenantId: true, openedAt: true },
      });

      for (const cycle of forgottenCycles) {
        await prisma.notification.create({
          data: {
            tenantId: cycle.tenantId,
            title:    "Caisse toujours ouverte",
            message:  `Votre caisse est ouverte depuis plus de 20h. Pensez à la fermer si la journée est terminée.`,
          },
        });
      }

      if (forgottenCycles.length > 0) {
        console.log(`[CRON] ${forgottenCycles.length} alerte(s) cycle oublié envoyée(s)`);
      }
    } catch (error) {
      console.error("[CRON] Erreur cycle :", error);
    }
  });
}