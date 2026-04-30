# Plan d'Architecture : SaaS Multi-Modèles & Templates Dynamiques

Ce document décrit la stratégie pour transformer l'application actuelle en un SaaS capable de proposer des configurations d'applications et des designs spécifiques selon le type d'établissement (Restaurant, Bar, Café, Fast-Food, etc.).

---

## 1. Vision du Produit
L'objectif est que chaque client (Tenant) bénéficie d'une expérience personnalisée dès son inscription :
- **Pré-configuration** : Menu de base, Rôles standards et Permissions adaptés.
- **Identité Visuelle** : Design (couleurs, typographies, icônes) correspondant à l'ambiance de l'établissement.
- **Fonctionnalités Métier** : Activation de modules spécifiques (ex: Gestion de tables pour Restaurant vs Vente comptoir pour Fast-Food).

---

## 2. Évolutions de l'Architecture (Backend)

### A. Extension du modèle Tenant
Ajouter des champs pour stocker les préférences de template et de configuration.
```prisma
model Tenant {
  // ... existant
  config      Json?     // { "modules": ["KDS", "TABLE_MANAGEMENT"], "settings": { ... } }
  themeConfig Json?     // { "primaryColor": "#FF6B00", "font": "Inter", "template": "MODERN_DARK" }
  logoUrl     String?
}
```

### B. Système de Modèles (Templates)
Créer une logique de "Seeding" intelligente par `BusinessType` :
- **RESTAURANT** : Crée par défaut les catégories (Entrées, Plats, Desserts) et les rôles (Serveur, Maître d'hôtel).
- **BAR** : Crée par défaut les catégories (Cocktails, Bières, Softs) et le rôle (Barman).
- **BOUTIQUE** : (Nouveau type potentiel) Gestion simplifiée des stocks et scan code-barres.

---

## 3. Système de Design Dynamique (Frontend)

### A. Theme Provider (React)
Utiliser un contexte global pour injecter les styles basés sur la configuration du Tenant.
- **CSS Variables** : Les couleurs et espacements seront pilotés par des variables injectées dynamiquement (`--color-primary`, `--radius-custom`).
- **Composants Adaptatifs** : Certains composants changeront de comportement (ex: la carte de produit avec ou sans options de cuisson).

### B. Catalogue de Templates
Proposer 3 styles de base :
1. **Élégance (Dark)** : Tons sombres, dorés, typographies avec empattement (Idéal Bars/Restaurants chics).
2. **Vibrant (Pop)** : Couleurs vives, angles très arrondis, icônes ludiques (Idéal Fast-Food/Cafés).
3. **Minimal (Clean)** : Blanc dominant, gris clair, design épuré (Idéal Boulangeries/Boutiques).

---

## 4. Modules Applicatifs par Modèle

| Module | Restaurant | Bar | Fast-Food | Café |
| :--- | :---: | :---: | :---: | :---: |
| Gestion des Tables | ✅ | ⚠️ Opt | ❌ | ✅ |
| Cuisine (KDS) | ✅ | ❌ | ✅ | ✅ |
| Gestion des Notes/Tabs | ❌ | ✅ | ❌ | ❌ |
| Bornes de commande | ⚠️ Opt | ❌ | ✅ | ❌ |
| Click & Collect | ✅ | ❌ | ✅ | ✅ |

---

## 5. Parcours Utilisateur (Onboarding)

1. **Choix du type** : "Quel est votre type d'établissement ?"
2. **Sélection du Template** : Aperçu visuel des 3 styles.
3. **Personnalisation Express** : Upload du logo et choix de la couleur principale.
4. **Génération** : Le système crée le workspace avec les produits modèles déjà présents dans `ProductModel`.

---

## 6. Prochaines Étapes Techniques

1. **Sprint 1 : Core Design System**
   - Remplacer les couleurs hardcodées par des variables CSS dans tout le projet.
   - Créer le `ThemeProvider` dans `App.tsx`.

2. **Sprint 2 : Onboarding Logic**
   - Créer une nouvelle page `EstablishmentSetup` après le register.
   - Implémenter l'API de création automatique de données (Categories/Roles) basée sur le type.

3. **Sprint 3 : UI Templates**
---

## 10. Évolution de la Stack Technique (Recommandations)

Pour passer à l'échelle supérieure, voici comment faire évoluer votre stack actuelle (React, Node, Express) :

### A. Backend : Passer de la Monolithe au Micro-Framework
- **NestJS (Node.js)** : Recommandé pour remplacer Express sur les services critiques. NestJS impose une structure robuste (Injections de dépendances, Modules) idéale pour les microservices.
- **Python (FastAPI)** : À introduire spécifiquement pour les modules d'IA (Agent IA, Menu Engineering). Python possède les meilleures librairies (LangChain, OpenAI, Pandas) pour le traitement de données.
- **Go (Golang)** : (Optionnel) Pour des services ultra-performants comme le moteur de calcul des commandes en temps réel si vous avez des millions de transactions simultanées.

### B. Frontend : Vers plus de Performance
- **Next.js** : Évoluer de React (Vite) vers Next.js pour le Dashboard Admin. Cela permet un meilleur SEO (pour attirer de nouveaux clients) et un chargement plus rapide via le Server Side Rendering (SSR).
- **Tailwind CSS** : Pour une productivité accrue sur le design atomique des templates.

### C. Infrastructure & Data
- **Docker & Kubernetes** : Indispensable pour conteneuriser vos microservices et laisser l'Agent IA les orchestrer (Auto-scaling).
- **Redis** : Pour le cache ultra-rapide et la gestion des sessions en temps réel (WebSocket).
- **PostgreSQL (Prisma)** : Conserver pour les données relationnelles, mais ajouter **MongoDB** ou **ElasticSearch** pour le stockage des logs d'audit et la recherche ultra-rapide dans les catalogues de produits.
- **Terraform** : Pour définir votre infrastructure par code (IaC), permettant de recréer tout votre environnement en un clic.

### D. Intelligence Artificielle
- **OpenAI API / LangChain** : Pour le moteur de raisonnement de l'agent.
- **Pinecone / Weaviate** : Base de données vectorielle si vous voulez que l'IA "apprenne" de tous les manuels d'utilisation et documents métier de vos clients.

---

## 7. Architecture Microservices & Évolutivité

Pour supporter une croissance massive (milliers de tenants), le passage aux microservices est recommandé :

### A. Découpage Sémantique
1. **Service Auth & Identity** : Gestion des utilisateurs, tenants et permissions (RBAC).
2. **Service Catalogue** : Produits, catégories et modèles de produits (Lecture intensive).
3. **Service Commandes (Order Engine)** : Gestion du cycle de vie des commandes (Transactionnel lourd).
4. **Service Paiement & Fiscalité** : Intégration passerelles (Mobile Money, Stripe) et facturation.
5. **Service Analytics & Reporting** : Agrégation de données pour les rapports financiers.

### B. Communication
- **API Gateway** : Point d'entrée unique avec gestion du rate-limiting par tenant.
- **Message Broker (RabbitMQ/Kafka)** : Communication asynchrone pour les tâches lourdes (ex: génération de rapports, notifications push).

---

## 8. Agent IA d'Orchestration (Ops-AI)

Une IA dédiée à la gestion de l'infrastructure pour garantir une haute disponibilité :

- **Auto-Healing** : Détection automatique des microservices en échec et redémarrage intelligent.
- **Scaling Prédictif** : L'IA analyse les pics de fréquentation historiques (ex: samedi soir) et pré-provisionne des ressources.
- **Analyse de Logs** : Détection proactive d'anomalies ou de tentatives d'intrusion (Sécurité).
- **Interface de Chat Ops** : Possibilité pour le SuperAdmin de demander : *"IA, quel est l'état de santé du service de paiement dans la région Ouest ?"*

---

## 9. Fonctionnalités d'Automatisation Intelligente (Value-Add)

Ces fonctionnalités transforment le logiciel de simple outil en un véritable assistant métier pour le client :

### A. IA Menu Engineering (Optimisation des Marges)
- L'IA analyse quels plats sont les plus rentables et les plus populaires (Matrice BCG).
- Elle suggère des modifications de prix ou la mise en avant de certains produits sur le menu digital.

### B. Gestion des Stocks Prédictive
- **Alerte intelligente** : *"Selon vos ventes actuelles, vous manquerez de Bière pression d'ici 20h. Voulez-vous commander chez votre fournisseur habituel ?"*
- **Réapprovisionnement auto** : Génération automatique de bons de commande basés sur la consommation réelle.

### C. Assistant Vocal pour le Staff
- Intégration de commandes vocales dans le terminal POS : *"Hey POS, ajoute une Pizza Royale à la table 5"* ou *"Quel est le chiffre d'affaires actuel ?"*.

### D. Automatisation Marketing (CRM IA)
- **Campagnes de rétention** : L'IA identifie les clients qui ne sont pas venus depuis 15 jours et leur envoie un coupon personnalisé par SMS/Email.
- **Analyse de sentiment** : Analyse automatique des avis laissés sur les QR Menus pour alerter le manager en cas d'insatisfaction immédiate.

### E. Rapports Automatisés de Clôture
- À la fin de chaque cycle, l'IA génère un résumé audio ou texte court : *"Bonne journée ! Votre CA est en hausse de 12% par rapport à mardi dernier. Votre produit phare était le Burger Maison."*

---

## 11. Stratégie Multi-Plateforme (Web & Mobile)

Pour offrir une expérience fluide sur tous les supports, voici la répartition technologique :

### A. Web (Next.js)
- **Usage** : Dashboard Administrateur, Portail SuperAdmin et Menu QR Client.
- **Avantages** : Performance (SSR/ISR), SEO optimisé pour l'acquisition de nouveaux clients et maintenance simplifiée.

### B. Mobile Natif (Kotlin & Swift)
- **Android (Kotlin)** : Dédié aux terminaux POS (tablettes) et aux employés. Permet une intégration parfaite avec les imprimantes thermiques et le matériel de caisse.
- **iOS (Swift)** : Application premium pour les propriétaires (suivi en temps réel) et version client sur iPhone.
- **Avantage du Natif** : Performance brute, fluidité exceptionnelle et accès sans restriction aux APIs matérielles (NFC, Bluetooth, Biométrie).

---

## 12. Résumé de la Nouvelle Vision
Le projet évolue d'une application de gestion classique vers un **Écosystème SaaS Intelligent** piloté par l'IA, capable de s'auto-gérer via des microservices et d'offrir une expérience native ultra-rapide sur tous les appareils.
