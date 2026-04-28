// src/data/menuTemplates.ts

export interface MenuTemplate {
  name: string;
  categoryType: "FOOD" | "DRINK";
  imageUrl: string;
  defaultPrice: number;
  colorCode: string;
  unit: string;
  description?: string;
}

export const MENU_TEMPLATES: MenuTemplate[] = [
  // --- FOOD ---
  {
    name: "Burger Classique",
    categoryType: "FOOD",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    defaultPrice: 3500,
    colorCode: "#F59E0B",
    unit: "plat",
    description: "Pain brioché, steak haché 150g, salade, tomate, oignons."
  },
  {
    name: "Pizza Margherita",
    categoryType: "FOOD",
    imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800",
    defaultPrice: 4500,
    colorCode: "#EF4444",
    unit: "unité",
    description: "Sauce tomate maison, mozzarella fior di latte, basilic frais."
  },
  {
    name: "Salade César",
    categoryType: "FOOD",
    imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=800",
    defaultPrice: 3800,
    colorCode: "#10B981",
    unit: "plat",
    description: "Poulet grillé, croûtons, parmesan, sauce césar maison."
  },
  {
    name: "Tacos Poulet",
    categoryType: "FOOD",
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800",
    defaultPrice: 2500,
    colorCode: "#F59E0B",
    unit: "unité",
  },
  {
    name: "Sushi Mix (12 pcs)",
    categoryType: "FOOD",
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800",
    defaultPrice: 8500,
    colorCode: "#EC4899",
    unit: "plateau",
  },

  // --- DRINK ---
  {
    name: "Coca Cola",
    categoryType: "DRINK",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800",
    defaultPrice: 1000,
    colorCode: "#EF4444",
    unit: "canette",
  },
  {
    name: "Jus d'Orange Frais",
    categoryType: "DRINK",
    imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=800",
    defaultPrice: 1500,
    colorCode: "#F59E0B",
    unit: "verre",
  },
  {
    name: "Café Cappuccino",
    categoryType: "DRINK",
    imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=800",
    defaultPrice: 1800,
    colorCode: "#8B5CF6",
    unit: "tasse",
  },
  {
    name: "Mojito Classique",
    categoryType: "DRINK",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    defaultPrice: 3500,
    colorCode: "#10B981",
    unit: "verre",
  },
  {
    name: "Eau Minérale (1.5L)",
    categoryType: "DRINK",
    imageUrl: "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&q=80&w=800",
    defaultPrice: 500,
    colorCode: "#3B82F6",
    unit: "bouteille",
  },
];
