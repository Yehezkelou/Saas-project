// =============================================================
//  src/components/ui/index.tsx
//  Design system de base — composants réutilisables dans
//  les 3 espaces (client, POS, admin)
//
//  PRINCIPE :
//  Chaque composant accepte les props standard de React Native
//  + des props "thème" simplifiées (variant, size, etc.)
// =============================================================

import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import theme, { colors, typography, spacing, radius, shadows } from "../../theme";

// ─────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────
interface ButtonProps {
  label:     string;
  onPress:   () => void;
  variant?:  "primary" | "outline" | "ghost" | "danger";
  size?:     "sm" | "md" | "lg";
  disabled?: boolean;
  loading?:  boolean;
  fullWidth?: boolean;
  style?:    ViewStyle;
}

export function Button({
  label, onPress, variant = "primary", size = "md",
  disabled, loading, fullWidth, style,
}: ButtonProps) {

  const heights  = { sm: 36, md: 46, lg: 56 };
  const paddings = { sm: spacing.md, md: spacing.lg, lg: spacing.xl };
  const fontSizes = { sm: typography.sm, md: typography.base, lg: typography.md };

  const variantStyles: Record<string, { bg: string; border?: string; text: string }> = {
    primary: { bg: colors.primary,  text: colors.white   },
    outline: { bg: "transparent", border: colors.primary, text: colors.primary },
    ghost:   { bg: "transparent",  text: colors.textSecondary },
    danger:  { bg: colors.danger,   text: colors.white   },
  };

  const v = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.button,
        {
          height:            heights[size],
          paddingHorizontal: paddings[size],
          backgroundColor:   disabled ? colors.border : v.bg,
          borderWidth:       v.border ? 1.5 : 0,
          borderColor:       v.border,
          width:             fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={v.text} size="small" />
        : <Text style={[styles.buttonText, {
            color:    disabled ? colors.textTertiary : v.text,
            fontSize: fontSizes[size],
          }]}>
            {label}
          </Text>
      }
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────
interface CardProps {
  children:   React.ReactNode;
  style?:     ViewStyle;
  onPress?:   () => void;
  padding?:   number;
  shadow?:    "sm" | "md" | "lg" | "none";
}

export function Card({ children, style, onPress, padding = spacing.base, shadow = "md" }: CardProps) {
  const shadowStyle = shadow === "none" ? {} : shadows[shadow];

  const content = (
    <View style={[styles.card, { padding }, shadowStyle, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ─────────────────────────────────────────────────────────────
// BADGE — Statut commande
// ─────────────────────────────────────────────────────────────
interface BadgeProps {
  status: "PENDING" | "ACCEPTED" | "READY" | "PAID" | "VALIDATED" | "REJECTED" | "CANCELLED";
  size?:  "sm" | "md";
}

export function OrderStatusBadge({ status, size = "md" }: BadgeProps) {
  const { bg, text, label } = theme.orderStatusColors[status] ?? theme.orderStatusColors.PENDING;
  const fontSize = size === "sm" ? typography.xs : typography.sm;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text, fontSize }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// LOADING SCREEN — plein écran avec spinner
// ─────────────────────────────────────────────────────────────
export function LoadingScreen({ message = "Chargement..." }: { message?: string }) {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE — quand une liste est vide
// ─────────────────────────────────────────────────────────────
export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PRICE — affiche un montant formaté en FCFA
// ─────────────────────────────────────────────────────────────
export function Price({ amount, size = "md", bold }: {
  amount: number;
  size?:  "sm" | "md" | "lg" | "xl";
  bold?:  boolean;
}) {
  const sizes = { sm: typography.sm, md: typography.base, lg: typography.lg, xl: typography.xl };

  // Format : 5 000 FCFA
  const formatted = new Intl.NumberFormat("fr-FR").format(amount);

  return (
    <Text style={{
      fontSize:   sizes[size],
      fontWeight: bold ? typography.bold : typography.regular,
      color:      colors.primary,
    }}>
      {formatted} FCFA
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  button: {
    borderRadius:   radius.md,
    alignItems:     "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: typography.bold,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius:    radius.lg,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   3,
    borderRadius:      radius.full,
    alignSelf:         "flex-start",
  },
  badgeText: {
    fontWeight: typography.medium,
  },
  loadingScreen: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap:            spacing.md,
  },
  loadingText: {
    color:    colors.textSecondary,
    fontSize: typography.base,
  },
  emptyState: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    padding:        spacing.xxxl,
  },
  emptyTitle: {
    fontSize:   typography.lg,
    fontWeight: typography.medium,
    color:      colors.textPrimary,
    textAlign:  "center",
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize:  typography.base,
    color:     colors.textSecondary,
    textAlign: "center",
  },
});