// =============================================================
//  MIDDLEWARES/PLAN-GATE.MIDDLEWARE.TS
//
//  Deux middlewares distincts, toujours utilisés APRÈS requireAuth
//  et requireActiveTenant (qui injectent req.user et req.tenantId) :
//
//  1. requirePlan("PRO")
//     → Bloque si le tenant n'a pas ce plan ou supérieur
//     → Usage : routes réservées aux plans payants
//
//  2. checkLimit("staff_count")
//     → Vérifie que le tenant n'a pas atteint sa limite avant une création
//     → Usage : avant POST /staff, POST /products, etc.
//
//  Hiérarchie des plans : FREE < PRO < BUSINESS
// =============================================================

import type { Request, Response, NextFunction } from "express";
import prisma from "./prisma";
import {
  getPlanLimits,
  isWithinLimit,
  getLimitExceededMessage,
  type PlanLimitKey,
} from "./plan-limits";

// Ordre hiérarchique des plans (plus l'index est élevé, plus le plan est haut)
const PLAN_HIERARCHY: Record<string, number> = {
  FREE:     0,
  PRO:      1,
  BUSINESS: 2,
};

declare global {
    namespace Express {
        interface Request {
            currentPlan?: string;
        }
    }
}

// ── requirePlan ───────────────────────────────────────────────
// Bloque l'accès si le tenant n'a pas le plan minimum requis.
//
// Usage :
//   router.get("/reports", requireAuth, requireActiveTenant,
//              requirePlan("PRO"), ReportController.get)
//
export function requirePlan(minimumPlan: "FREE" | "PRO" | "BUSINESS") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { tenantId: req.tenant! },
        select: { plan: true, status: true, expiresAt: true },
      });

      if (!subscription || subscription.status !== "ACTIVE") {
        return res.status(403).json({
          success: false,
          message: "Abonnement inactif",
          upgradeRequired: true,
        });
      }

      const currentLevel = PLAN_HIERARCHY[subscription.plan] ?? 0;
      const requiredLevel = PLAN_HIERARCHY[minimumPlan] ?? 0;

      if (currentLevel < requiredLevel) {
        return res.status(403).json({
          success: false,
          message: `Cette fonctionnalité nécessite le plan ${minimumPlan} ou supérieur. Votre plan actuel : ${subscription.plan}.`,
          currentPlan:  subscription.plan,
          requiredPlan: minimumPlan,
          upgradeRequired: true,
        });
      }

      // Injecter le plan dans la requête pour les controllers
      req.currentPlan = subscription.plan;
      next();

    } catch {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  };
}

// ── checkLimit ────────────────────────────────────────────────
// Vérifie qu'une limite n'est pas dépassée avant une création.
// countFn est une fonction qui compte les entités existantes.
//
// Usage :
//   router.post("/staff", requireAuth, requireActiveTenant,
//     checkLimit("staff_count", (tenantId) =>
//       prisma.staff.count({ where: { tenantId } })
//     ),
//     validate(createStaffSchema),
//     StaffController.create
//   )
//
export function checkLimit(
  limitKey: PlanLimitKey,
  countFn: (tenantId: string) => Promise<number>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { tenantId: req.tenant! },
        select: { plan: true },
      });

      const plan = subscription?.plan ?? "FREE";
      const limits = getPlanLimits(plan);
      const limit = limits![limitKey]!;

      // Compter les entités actuelles
      const current = await countFn(req.tenant!);

      if (!isWithinLimit(current, limit)) {
        return res.status(403).json({
          success: false,
          message: getLimitExceededMessage(limitKey, plan, limit),
          current,
          limit,
          currentPlan: plan,
          upgradeRequired: true,
        });
      }

      next();
    } catch {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  };
}

// ── checkMonthlyOrderLimit ────────────────────────────────────
// Cas spécial : limite mensuelle des commandes.
// Compte les commandes du mois calendaire en cours.
//
export function checkMonthlyOrderLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { tenantId: req.tenant! },
        select: { plan: true },
      });

      const plan = subscription?.plan ?? "FREE";
      const limits = getPlanLimits(plan);
      const monthlyLimit = limits!["orders_per_month"];

      // -1 = illimité (plans PRO et BUSINESS) → on passe directement
      if (monthlyLimit === -1) return next();

      // Compter les commandes du mois en cours
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const orderCount = await prisma.order.count({
        where: {
          tenantId: req.tenant!,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      });

      if (orderCount >= monthlyLimit) {
        return res.status(403).json({
          success: false,
          message: `Limite FREE atteinte : ${monthlyLimit} commandes par mois. Passez au plan PRO pour des commandes illimitées.`,
          current: orderCount,
          limit:   monthlyLimit,
          currentPlan:     plan,
          upgradeRequired: true,
        });
      }

      next();
    } catch {
      return res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  };
}