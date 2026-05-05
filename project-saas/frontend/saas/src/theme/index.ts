// =============================================================
//  src/theme/index.ts
//  Thème global de l'application
//
//  POURQUOI UN THÈME CENTRALISÉ ?
//  Si on veut changer la couleur principale de toute l'app,
//  on modifie UN seul endroit ici. Sans thème, on cherche
//  "#FF6B35" dans 50 fichiers différents.
//
//  ADAPTATIF TABLETTE :
//  Les tablettes ont plus de place → on peut afficher plus.
//  On utilise Dimensions pour détecter si on est sur tablette
//  et adapter les tailles (police, grille, padding).
// =============================================================

import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

// ── Détection tablette ─────────────────────────────────────
// Une tablette a généralement une largeur > 600px
export const isTablet = width >= 600;
export const isIOS    = Platform.OS === "ios";

// ── Palette de couleurs ────────────────────────────────────
export const colors = {
  // Couleur principale — orange chaleureux (restaurant/food)
  primary:       "#FF6B35",
  primaryLight:  "#FF8C5A",
  primaryDark:   "#E55520",
  primaryFaint:  "#FFF0EB",

  // Couleur secondaire — vert succès
  success:       "#2ECC71",
  successLight:  "#A8F0C6",
  successFaint:  "#F0FFF6",

  // Statuts commandes
  pending:       "#F39C12",  // Orange → En attente
  accepted:      "#3498DB",  // Bleu   → En préparation
  ready:         "#2ECC71",  // Vert   → Prêt à servir
  paid:          "#95A5A6",  // Gris   → Payé

  // Danger / erreur
  danger:        "#E74C3C",
  dangerFaint:   "#FDF0EE",

  // Neutres
  white:         "#FFFFFF",
  background:    "#F8F6F3",  // Fond légèrement chaud (pas blanc pur)
  surface:       "#FFFFFF",  // Cards, inputs
  border:        "#E8E3DD",
  borderLight:   "#F0EDE9",

  // Texte
  textPrimary:   "#1A1A1A",
  textSecondary: "#6B6560",
  textTertiary:  "#A09890",
  textInverse:   "#FFFFFF",
} as const;

// ── Typographie ────────────────────────────────────────────
// Les tailles s'adaptent si on est sur tablette (+2px partout)
const fontScale = isTablet ? 2 : 0;

export const typography = {
  // Tailles
  xs:   10 + fontScale,
  sm:   12 + fontScale,
  base: 14 + fontScale,
  md:   16 + fontScale,
  lg:   18 + fontScale,
  xl:   22 + fontScale,
  xxl:  28 + fontScale,
  xxxl: 36 + fontScale,

  // Graisses
  regular: "400" as const,
  medium:  "500" as const,
  bold:    "700" as const,

  // Familles (React Native utilise les polices système par défaut)
  // Sur iOS : SF Pro, sur Android : Roboto
  family: {
    regular: Platform.OS === "ios" ? "System" : "sans-serif",
    medium:  Platform.OS === "ios" ? "System" : "sans-serif-medium",
    bold:    Platform.OS === "ios" ? "System" : "sans-serif-bold",
  },
} as const;

// ── Espacement ─────────────────────────────────────────────
// Système d'espacement en multiples de 4
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,
} as const;

// ── Bordures ───────────────────────────────────────────────
export const radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 999,  // Cercle parfait
} as const;

// ── Ombres ─────────────────────────────────────────────────
// iOS et Android ont des systèmes d'ombre différents
export const shadows = {
  sm: {
    // iOS
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  3,
    // Android
    elevation: 2,
  },
  md: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius:  8,
    elevation: 4,
  },
  lg: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius:  16,
    elevation: 8,
  },
} as const;

// ── Layout adaptatif tablette ──────────────────────────────
// Sur tablette, on affiche plus de colonnes dans les grilles
export const layout = {
  screenWidth:  width,
  screenHeight: height,

  // Padding horizontal des écrans
  screenPadding: isTablet ? spacing.xxl : spacing.base,

  // Nombre de colonnes dans la grille des produits
  productColumns: isTablet ? 3 : 2,

  // Nombre de colonnes dans la grille des tables
  tableColumns: isTablet ? 4 : 2,

  // Hauteur de la barre de navigation bottom
  bottomBarHeight: isIOS ? 83 : 60,
} as const;

// ── Couleurs des statuts commande ──────────────────────────
// Utilisé dans les badges et les indicateurs
export const orderStatusColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:  { bg: "#FEF3CD", text: "#856404", label: "En attente"   },
  ACCEPTED: { bg: "#CCE5FF", text: "#004085", label: "En préparation" },
  READY:     { bg: "#D4EDDA", text: "#155724", label: "Prêt"         },
  PAID:      { bg: "#E2E3E5", text: "#383D41", label: "Payé"         },
  VALIDATED: { bg: "#D1ECF1", text: "#0C5460", label: "Validé"       },
  REJECTED:  { bg: "#F8D7DA", text: "#721C24", label: "Rejeté"       },
  CANCELLED: { bg: "#F8D7DA", text: "#721C24", label: "Annulé"       },
};

// ── Export du thème complet ────────────────────────────────
const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  layout,
  isTablet,
  isIOS,
  orderStatusColors,
};

export default theme;