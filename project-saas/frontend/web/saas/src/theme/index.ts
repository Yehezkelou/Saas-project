// src/theme/index.ts — constantes utilisées dans les styles inline

export const colors = {
  primary:       "var(--color-primary)",
  primaryFaint:  "var(--color-primary-faint)",
  success:       "var(--color-success)",
  successFaint:  "var(--color-success-faint)",
  danger:        "var(--color-danger)",
  dangerFaint:   "var(--color-danger-faint)",
  bg:            "var(--color-bg)",
  surface:       "var(--color-surface)",
  border:        "var(--color-border)",
  textPrimary:   "var(--color-text-primary)",
  textSecondary: "var(--color-text-secondary)",
  textTertiary:  "var(--color-text-tertiary)",
  white:         "#FFFFFF",
};

export const orderStatusConfig: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "#FEF3CD", color: "#856404", label: "En attente" },
  VALIDATED: { bg: "#D4EDDA", color: "#155724", label: "Validé"    },
  REJECTED:  { bg: "#F8D7DA", color: "#721C24", label: "Rejeté"    },
  PAID:      { bg: "#E2E3E5", color: "#383D41", label: "Payé"      },
};

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA";
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  });
}