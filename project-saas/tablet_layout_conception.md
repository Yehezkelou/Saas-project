# Conception Détaillée : Sidebar Rétractable pour Tablettes

Ce document détaille la conception technique et ergonomique de la navigation pour les tablettes (768px - 1024px).

## 1. Objectifs Ergonomiques
- **Maximisation de l'espace** : Sur tablette, l'écran est plus étroit que sur desktop. Une sidebar complète (260px+) consomme trop d'espace horizontal utile pour les tableaux et graphiques.
- **Accessibilité tactile** : Les icônes doivent être assez grandes (min 44x44px) pour être cliquées sans erreur.
- **Clarté visuelle** : L'utilisateur doit toujours savoir où il se trouve, même si le texte est masqué.

## 2. États de la Sidebar

### A. État Réduit (Mini Sidebar) - Par défaut sur Tablette
- **Largeur** : 80px.
- **Contenu** : 
    - Uniquement les icônes centrées.
    - Labels masqués (`display: none`).
    - Tooltips (bulles d'aide) apparaissant au survol pour confirmer la destination.
- **Transition** : Animation fluide de la largeur via `transition: width 0.3s ease`.

### B. État Étendu (Full Sidebar) - Optionnel / Desktop
- **Largeur** : 260px.
- **Contenu** : Icône + Label + Indicateurs de statut.
- **Transition** : Les labels apparaissent en fondu (`opacity`) après l'expansion de la largeur.

## 3. Comportement & Interaction

- **Auto-Adaptation** : 
    - `< 768px` : Sidebar masquée (Drawer uniquement).
    - `768px - 1200px` : Sidebar réduite par défaut.
    - `> 1200px` : Sidebar étendue par défaut.
- **Contrôle Manuel** : Un bouton "Chevron" en bas de la sidebar permet à l'utilisateur de forcer l'état (réduire/étendre) selon sa préférence.
- **Survol (Hover)** : Sur tablette (tactile), le survol n'existe pas. L'icône active doit avoir une couleur contrastée ou un indicateur visuel fort (ex: barre verticale à gauche).

## 4. Structure Technique (Pseudo-code CSS)

```css
.sidebar {
  width: var(--sidebar-width);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: hidden;
}

/* Tablette / Mini mode */
@media (min-width: 768px) and (max-width: 1200px) {
  :root { --sidebar-width: 80px; }
  .sidebar-label { opacity: 0; pointer-events: none; }
  .nav-item { justify-content: center; padding: 12px 0; }
}

/* Desktop / Extended mode */
@media (min-width: 1201px) {
  :root { --sidebar-width: 260px; }
  .sidebar-label { opacity: 1; transition: opacity 0.2s 0.1s; }
}
```

## 5. Ajustement du Contenu Principal
Le conteneur principal (`main-content`) doit utiliser une marge ou un padding dynamique calqué sur la variable `--sidebar-width` pour éviter les chevauchements. L'utilisation de `flex: 1` dans un conteneur `display: flex` est recommandée pour une adaptation fluide.

## 6. Prochaines Actions
- [ ] Implémenter le switch de variable CSS dans `AdminLayout.tsx`.
- [ ] Créer le composant `NavItem` qui gère l'affichage conditionnel du label.
- [ ] Ajouter les tooltips pour le mode réduit.
