# Plan de Mise en Conformité Responsive (Mobile & Tablette)

Ce document détaille la stratégie pour rendre l'ensemble du système (Admin SaaS et Interface POS) parfaitement utilisable sur Android (smartphones) et Tablettes.

## 1. Breakpoints & Grille
Nous utiliserons une approche **Mobile-First** pour les nouveaux composants.
- **Mobile (Smartphone)** : `< 768px` (Portrait Android)
- **Tablette** : `768px - 1024px` (iPad, Tablettes Android)
- **Desktop** : `> 1024px`

## 2. Navigation & Layout Global

### Admin Dashboard
- **Desktop** : Sidebar fixe à gauche (280px).
- **Mobile** : 
    - Remplacer la Sidebar par un **Menu tiroir (Drawer)** accessible via un bouton hamburger.
    - Ajouter une **Barre de navigation basse (Bottom Nav)** pour les actions rapides (Dashboard, Ventes, Menu, Staff).
- **Tablette** : Sidebar rétractable (icônes uniquement) pour maximiser l'espace de travail.

### Interface POS (Caisse)
- **Tablette (Cible principale)** : Garder le layout actuel mais optimiser la taille des zones tactiles.
- **Mobile (Prise de commande nomade)** :
    - Passer à un layout à une seule colonne.
    - Utiliser des "Modales plein écran" pour la sélection des produits et le panier.

## 3. Optimisations Spécifiques

### Tableaux & Listes (Admin)
- **Problème** : Les grands tableaux débordent sur mobile.
- **Solution** : 
    - Transformer les lignes de tableau en **Cartes (Cards)** sur mobile.
    - Masquer les colonnes secondaires (ex: ID, Date de création) sur smartphone.
    - Activer le défilement horizontal (`overflow-x: auto`) sur les conteneurs de tableaux.

### Formulaires & Modales
- **Changement** : Les modales centrées deviennent des **"Bottom Sheets"** (tiroirs montant du bas) sur mobile pour faciliter l'usage à une main.
- **Inputs** : Agrandir les champs (`min-height: 48px`) et les boutons pour éviter les erreurs de clic sur écran tactile.

### Graphiques & Statistiques
- Utiliser des conteneurs à ratio d'aspect fixe (`aspect-ratio: 16/9`) qui s'adaptent à la largeur de l'écran.
- Réduire le nombre de labels sur les axes X des graphiques sur mobile.

## 4. Checklist Technique (Actions à venir)

### CSS Global (`index.css`)
- [ ] Définir des variables de spacing fluides (ex: `--padding-page: clamp(16px, 4vw, 32px)`).
- [ ] Ajouter des helper classes `.hide-mobile`, `.show-mobile-only`.

### Composants UI
- [ ] **Modal** : Adapter la largeur à 100% sur mobile avec des coins arrondis uniquement en haut.
- [ ] **Button** : Assurer une zone de clic minimale de 44x44px.
- [ ] **Input** : Désactiver le zoom automatique sur iOS/Android en s'assurant que `font-size` >= 16px.

### Pages Critiques
- [ ] **StaffPage** : Rendre la grille d'employés fluide (1 colonne sur mobile, 2 sur tablette, 3+ sur desktop).
- [ ] **MenuManager** : Optimiser la gestion du menu pour le drag & drop tactile.
- [ ] **CyclePage** : Simplifier l'affichage du numpad pour qu'il occupe tout l'écran sur smartphone.

## 5. Tests & Validation
- Validation sur simulateur Chrome (Pixel 7, iPad Air).
- Tests réels sur terminaux Android locaux (POS).
