// =============================================================
//  LIB/PLAN-LIMITS.TS — Source de vérité des limitations
//
//  C'est LE fichier central de toute la Phase 3.
//  Quand tu veux changer les limites d'un plan, tu modifies
//  UNIQUEMENT ce fichier. Tout le reste s'adapte automatiquement.
//
//  Structure :
//  - PLAN_LIMITS : les chiffres bruts
//  - PlanLimitKey : les clés typées (TypeScript)
//  - getPlanLimits() : retourne les limites du plan actif
//  - isUnlimited() : true si la valeur est -1 (= infini)
// =============================================================

export type PlanLimitKey =
  | "orders_per_month"   // Nombre max de commandes par mois calendaire
  | "staff_count"        // Nombre max d'employés actifs
  | "product_count"      // Nombre max de produits actifs
  | "table_count"        // Nombre max de tables
  | "report_days"        // Historique des rapports en jours
  | "notifications"      // Accès aux notifications (0 = non, 1 = oui)
  | "categories_count"  // Nombre max de catégories
  | "statistic_days";    // Plage maximum (en jours) pour calculer les statistiques

// -1 = illimité
export const PLAN_LIMITS: Record<string, Record<PlanLimitKey, number>> = {
  FREE: {
    orders_per_month: 100,
    staff_count:      2,
    product_count:    20,
    table_count:      3,
    categories_count: 5,
    report_days:      7,
    notifications:    0,  // Pas de notifications sur FREE
    statistic_days:   2,  // Plage max de 2 jours
  },
  PRO: {
    orders_per_month: -1,  // Illimité
    staff_count:      10,
    product_count:    100,
    table_count:      20,
    categories_count: 20,
    report_days:      90,
    notifications:    1,
    statistic_days:   15, // Plage max de 15 jours
  },
  BUSINESS: {
    orders_per_month: -1,
    staff_count:      -1,
    product_count:    -1,
    table_count:      -1,
    categories_count: -1,
    report_days:      365,
    notifications:    1,
    statistic_days:   30, // Plage max de 30 jours
  },
};

// Retourne les limites du plan actif
export function getPlanLimits(plan: string): Record<PlanLimitKey, number> | null {
  return PLAN_LIMITS[plan] ?? null;
}

// Vérifie si une limite est illimitée (-1)
export function isUnlimited(value: number): boolean {
  return value === -1;
}

// Vérifie si une valeur actuelle dépasse la limite du plan
// Retourne true si on peut encore ajouter (sous la limite)
export function isWithinLimit(current: number, limit: number): boolean {
  if (isUnlimited(limit)) return true;
  return current < limit;
}

// Message d'erreur standardisé pour les dépassements de limite
export function getLimitExceededMessage(key: PlanLimitKey, plan: string, limit: number): string {
  const labels: Record<PlanLimitKey, string> = {
    orders_per_month:  "commandes par mois",
    staff_count:       "employés",
    product_count:     "produits",
    table_count:       "tables",
    categories_count:  "catégories",
    report_days:       "jours d'historique",
    notifications:     "notifications",
    statistic_days:    "jours d'écart pour les statistiques",
  };

  return `Limite ${plan} atteinte : maximum ${limit} ${labels[key]}. Passez au plan supérieur pour continuer.`;
}