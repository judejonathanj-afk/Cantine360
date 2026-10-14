# Fiche technique — Cantine360

**Éditeur / opérateur plateforme :** Omnerys  
**Produit :** Cantine360 (tableau de bord **Cantine+**)  
**Version document :** 1.0 — octobre 2026  
**Public :** équipe Omnerys, partenaires, établissements pilotes, interlocuteurs DSI / RGPD  

---

## 1. Objet du document

Ce document décrit **comment Cantine360 est conçu, hébergé et exploité** dans l’écosystème **Omnerys**. Il complète un éventuel cahier des charges fonctionnel (périmètre métier, parcours utilisateur) et sert à :

- onboarder l’équipe Omnerys (support, déploiement, création d’établissements) ;
- répondre aux questions techniques des écoles ou collectivités ;
- documenter la séparation **plateforme Omnerys** / **tenant établissement**.

---

## 2. Présentation produit

### 2.1 Mission

Cantine360 est une application web de **pilotage du service de restauration scolaire** :

- saisie **terrain** (tablette cuisine) par service (date + déjeuner) et par **classe** ;
- suivi **RAB** (assiettes adaptées / resservies), refus, restes ;
- **menu du jour**, croisement **allergènes** et **régimes** (sans porc, végétarien) ;
- **poids des déchets** (maternelle / primaire) et module **Antigaspillage** (objectif en g / 100 assiettes) ;
- **Cantine+** : dashboard direction / admin (note sur 100, graphiques, « Lecture de la période ») ;
- **exports** (CSV, PDF selon écrans).

### 2.2 Périmètre actuel (V1 pilote)

| Inclus | Hors périmètre V1 (sauf évolution) |
|--------|-------------------------------------|
| Multi-écoles et classes par établissement | Paiement / facturation élèves |
| Rôles Admin établissement et Cuisine | Application mobile native |
| Console plateforme Omnerys | Mode hors-ligne complet |
| Hébergement cloud (Vercel + PostgreSQL) | Intégration SI complexe (ERP, Pronote…) |

### 2.3 Utilisateurs cibles

| Profil | Rôle applicatif | Usage typique |
|--------|-----------------|---------------|
| Direction / référent restauration | **ADMIN** | Paramétrage, élèves, dashboard Cantine+, Antigaspillage, exports |
| Équipe cuisine | **KITCHEN** | Service du jour, menu, compteurs, pesée déchets |
| Équipe Omnerys | **Plateforme** | Création / gestion des établissements, paramètres globaux |

---

## 3. Architecture

### 3.1 Vue d’ensemble

Application **monolithique Next.js** : interface utilisateur et API REST sur le même déploiement. Une base **PostgreSQL** centralise tous les établissements (multi-tenant **logique** : isolation par `establishmentId`).

```
[Navigateur tablette / PC]
        │ HTTPS
        ▼
[Vercel — Next.js App Router]
   ├── Pages (React / TypeScript)
   ├── Routes API (/api/…)
   └── Middleware (sessions JWT)
        │
        ▼
[PostgreSQL — ex. Supabase pooler]
   └── Schéma Prisma (Establishment, Service, Student, …)
```

### 3.2 Multi-tenant

- Chaque **établissement** (`Establishment`) possède : nom, slug, codes **admin** / **cuisine**, écoles, classes, élèves, services.
- Toutes les requêtes métier sont scellées par l’**identifiant établissement** porté par le JWT de session établissement.
- La **plateforme Omnerys** accède à la liste et à la création d’établissements via un **JWT distinct** (`kind: platform`).

### 3.3 Séparation des sessions (point clé Omnerys)

| Session | Cookie / JWT | Routes |
|---------|--------------|--------|
| **Établissement** | Rôle `ADMIN` ou `KITCHEN` + `establishmentId` | `/dashboard`, `/service`, `/antigaspillage`, `/api/establishment/…` |
| **Plateforme** | `kind: platform` | `/platform/*`, `/api/platform/*` |

Le **middleware** empêche qu’une session cantine ouverte dans le même navigateur n’accède aux API plateforme (erreur 401 si mélange de contextes). Omnerys peut donc utiliser un onglet dédié `/platform/login` sans conflit avec une démo établissement.

---

## 4. Stack technique

| Couche | Technologie |
|--------|-------------|
| Langage | TypeScript |
| Framework | Next.js (App Router) |
| UI | React, Tailwind CSS, composants Radix / shadcn |
| ORM | Prisma 7 |
| Base | PostgreSQL |
| Auth | JWT signés (`SESSION_SECRET`), cookies httpOnly |
| Hébergement app | Vercel (`vercel-build` : `prisma generate` + `next build`) |
| Tests unitaires | Vitest (logique métier, ex. calcul Cantine+) |

**Prérequis dev / ops :** Node.js ≥ 20, `DATABASE_URL`, secrets documentés dans `.env.example`.

---

## 5. Console plateforme Omnerys

### 5.1 Accès

- URL : **`/platform/login`** puis redirection vers **`/platform/establishments`**.
- Authentification : **PIN plateforme** (`PLATFORM_PIN` en environnement, ou hash en base `PlatformSettings.platformPinHash` pour remplacer le secret .env).

### 5.2 Fonctions opérateur

| Action | Description |
|--------|-------------|
| Lister les établissements | Nom, slug, date de création, nombre de classes |
| Créer un établissement | Nom, slug, génération **PIN admin** et **PIN cuisine** (à transmettre de façon sécurisée à l’école) |
| Gérer un établissement | Fiche détail (`/platform/establishments/[id]`) |
| Supprimer un établissement | `DELETE` API avec confirmation par **slug** (action destructive, cascade données) |
| Paramètres plateforme | `/platform/settings` (PIN plateforme, etc.) |

### 5.3 Bootstrap API (optionnel)

- `POST /api/establishments` avec `Authorization: Bearer BOOTSTRAP_SECRET` — création programmatique (scripts, automatisation), distinct du parcours UI plateforme.

### 5.4 Bonnes pratiques Omnerys

1. Ne jamais commiter `.env` ni transmettre les PIN par e-mail non chiffré si possible.
2. Après changement de PIN admin/cuisine côté établissement, les sessions existantes sont invalidées (`accessCredentialRevision`).
3. Vérifier **migrations Prisma** après chaque déploiement majeur (`npm run prisma:deploy` en CI ou manuel selon process).

---

## 6. Modules métier (côté établissement)

| Module | Route(s) | Données clés |
|--------|----------|--------------|
| **Service cuisine** | `/service/[serviceId]` | Présents, servis, RAB, refus, restes par classe |
| **Menu** | `/service/.../menu` | Plats, allergènes, grammages, porc / viande |
| **Antigaspillage** | `/antigaspillage` + bandeaux service | Mode activable par admin, objectif g/100, conseils |
| **Cantine+** | `/dashboard` | Fenêtre 7 ou 30 jours, note, graphiques, lecture de période |
| **Écoles & classes** | Admin | Niveaux maternelle / primaire, objectifs éco optionnels |
| **Élèves & allergènes** | Admin | Allergènes, notes parents, régimes |
| **Exports** | Admin | Tableaux / fichiers selon écran |

### 6.1 Règles métier notables

- **g / 100 assiettes** = poids déchets / portions servies × 100 (période filtrable).
- **Note Cantine+** : agrégat déchets, RAB, évolution vs période précédente (`computeCantinePulse`).
- **Antigaspillage** : vert / orange / rouge vs objectif établissement (`antiWasteStatus`).
- **Allergènes** : comparaison menu ↔ fiches élèves (« concernés menu », « à adapter » régimes).

---

## 7. Modèle de données (résumé)

Entités principales (Prisma) :

- **Establishment** — tenant, PIN, objectifs éco, paramètres Antigaspillage.
- **School**, **Group** — organisation ; niveau `MATERNELLE` | `PRIMAIRE`.
- **Student** — identité, `allergens[]`, `noPork`, `vegetarian`, `allergenNotes`.
- **Service** — date, `MealType`, poids déchets (total et/ou par cycle).
- **ServiceGroupMetrics** — compteurs par classe et par service.
- **Menu** / **MenuItem** — plats, allergènes, grammage.
- **AttendanceImport** — traces d’import présence (fichier).
- **PlatformSettings** — configuration globale Omnerys (singleton).

Suppression d’un établissement : **cascade** sur écoles, classes, élèves, services (irréversible).

---

## 8. Sécurité

### 8.1 Transport et secrets

- HTTPS terminé chez l’hébergeur (Vercel).
- `SESSION_SECRET` : signature JWT (plateforme + établissements).
- PIN établissement stockés **hashés** en base (`adminPin`, `kitchenPin` — non réversibles depuis l’UI école).

### 8.2 Contrôle d’accès

- **KITCHEN** : pas d’accès aux écrans admin sensibles (exports élèves complets, paramètres établissement selon routes protégées).
- **ADMIN** : périmètre complet de son établissement uniquement.
- **Plateforme** : pas de rôle « super-admin » dans la session cantine ; double mécanisme volontaire.

### 8.3 Durcissement recommandé (roadmap Omnerys)

- Rotation périodique `SESSION_SECRET` / PIN plateforme avec fenêtre de maintenance.
- Restriction IP ou SSO plateforme si volume d’établissements augmente.
- Journalisation des actions destructives (suppression établissement).

---

## 9. Données personnelles & RGPD

### 9.1 Données concernées

- Identité élèves (nom, prénom), **allergies et régimes alimentaires**, consignes parents.
- Données agrégées de restauration (non nominatives dans les graphiques Cantine+).

### 9.2 Finalités

- Sécurité alimentaire et organisation du service de cantine.
- Pilotage du gaspillage et reporting interne établissement.

### 9.3 Rôles RGPD (à formaliser par contrat)

| Acteur | Rôle typique |
|--------|----------------|
| Établissement scolaire / collectivité | **Responsable de traitement** |
| Omnerys (éditeur / hébergeur logiciel) | **Sous-traitant** ou co-traitant selon montage juridique |

### 9.4 Sous-traitants techniques (à lister dans le DPA)

- **Vercel** — hébergement application.
- **Fournisseur PostgreSQL** (ex. **Supabase** si `DATABASE_URL` pooler EU) — persistance.

Préciser la **région** des données (objectif : **Union européenne**).

### 9.5 Mesures & droits

- Accès restreint par authentification.
- Export / rectification via écrans admin élèves.
- Suppression : suppression établissement (plateforme) ou anonymisation selon procédure Omnerys.
- **Durée de conservation** : à définir contractuellement (ex. durée scolarité + délai légal archives).

---

## 10. Exploitation & déploiement

### 10.1 Environnements

| Environnement | Usage |
|---------------|--------|
| **Production** | Branche `main` → Vercel (ex. `cantine360.vercel.app`) |
| **Local** | `npm run dev`, Postgres local ou cloud, `.env` |

### 10.2 Pipeline type

1. Merge sur `main`.
2. Build Vercel (`prisma generate`, `next build`).
3. Migrations base : `npm run prisma:deploy` (script projet) si schéma modifié.
4. Smoke test : login plateforme, login établissement pilote, un service + dashboard.

### 10.3 Variables d’environnement (référence)

Voir `.env.example` :

- `DATABASE_URL` — PostgreSQL (pooler recommandé en serverless).
- `SESSION_SECRET` — obligatoire.
- `PLATFORM_PIN` — accès console Omnerys.
- `BOOTSTRAP_SECRET` — API bootstrap établissements.
- `PG_POOL_MAX` — option connexions (défaut conservateur en prod).

### 10.4 Sauvegardes & continuité

- Sauvegardes : politique du **fournisseur PostgreSQL** (snapshots quotidiens — à documenter dans l’offre Omnerys).
- **RPO / RTO** : à chiffrer commercialement (ex. RPO 24 h sur offre standard).
- Monitoring : logs Vercel ; script **`cantine-guard`** (`ops/cantine-guard`) pour contrôles automatisés si activé.

---

## 11. Prérequis côté client (école)

- Navigateur récent (Chrome, Safari, Edge) sur **tablette** ou PC.
- Connexion **Internet** stable (pas de mode offline garanti en V1).
- Formation courte cuisine (saisie service + pesée) et admin (Cantine+, Antigaspillage).

---

## 12. Support & évolution (Omnerys)

| Sujet | Recommandation |
|-------|----------------|
| **Support N1 école** | Référent admin établissement + FAQ Omnerys |
| **Support N2** | Équipe produit / technique Omnerys |
| **Incidents base** | Vérifier statut hébergeur BDD + Vercel |
| **Évolutions** | Releases via Git ; note de version par déploiement |

Roadmap indicative (non contractuelle) : renforcement RGPD, SSO, PWA offline partiel, connecteurs exports.

---

## 13. Glossaire

| Terme | Définition |
|-------|------------|
| **RAB** | Assiettes adaptées ou resservies |
| **Cantine+** | Module dashboard et scoring |
| **g / 100 assiettes** | Grammes de déchets pour 100 portions servies |
| **Tenant** | Établissement scolaire isolé logiquement |
| **Plateforme** | Console Omnerys de gestion des tenants |

---

## 14. Contacts & historique document

| | |
|--|--|
| **Produit** | Cantine360 |
| **Opérateur plateforme** | Omnerys |
| **Dépôt source** | Repository Cantine360 (Git) |
| **Mise à jour fiche** | Octobre 2026 — alignée sur branche `main` (Cantine+, Antigaspillage, console plateforme) |

---

*Document interne Omnerys — peut être adapté (logo, coordonnées légales, DPA) avant remise à un établissement ou partenaire.*
