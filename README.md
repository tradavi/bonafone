# Plateforme E-Commerce & Réparations

Application web Next.js 16 (App Router, TypeScript, Tailwind 4) implémentant le cahier des charges
*Plateforme E-Commerce & Système de Gestion de Réparations* (smartphones, tablettes, accessoires,
occasions et services de réparation).

## Stack technique

| Couche       | Choix                                                       |
|--------------|-------------------------------------------------------------|
| Frontend     | Next.js 16 (App Router) + React 19 + TypeScript             |
| Styling      | Tailwind CSS v4                                             |
| Icônes       | lucide-react                                                |
| Base de données | PostgreSQL via Prisma                                    |
| Validation   | Zod                                                         |
| Auth         | NextAuth (Phase 2 — non encore branché)                     |
| Paiement     | Stripe (Phase 2)                                            |
| Email/SMS    | Brevo + Twilio (Phase 3)                                    |

## Lancer le projet

```bash
# 1. Copier les variables d'environnement
cp .env.example .env

# 2. Installer
npm install

# 3. (Optionnel) Initialiser la DB Prisma
#    Nécessite un PostgreSQL accessible via DATABASE_URL.
npm run db:generate
npm run db:push
npm run db:seed

# 4. Lancer le serveur
npm run dev
```

L'app est accessible sur `http://localhost:3000`.

> **Note** — En l'état, l'app fonctionne sans base de données : les pages utilisent les données
> mockées de `src/lib/mock-data.ts`. Brancher Prisma quand vous voulez basculer en données réelles.

## Structure

```
src/
├── app/
│   ├── (auth)/                  # Connexion, inscription (hors layout compte)
│   ├── admin/                   # Back-office (dashboard, réparations, produits...)
│   ├── boutique/                # Catalogue (smartphones, tablettes, accessoires, occasions)
│   ├── compte/                  # Espace client
│   ├── contact/
│   ├── panier/
│   ├── produit/[slug]/          # Fiche produit
│   ├── reclamations/
│   ├── reparations/             # Hub + devis + suivi
│   ├── temoignages/
│   ├── layout.tsx               # Layout racine (TopBar, Header, Footer)
│   └── page.tsx                 # Page d'accueil
├── components/
│   ├── boutique/                # Filtres, page catalogue
│   ├── home/                    # Sections de la home (hero, categories, etc.)
│   ├── layout/                  # Header, Footer, TopBar
│   └── ui/                      # ProductCard, etc.
└── lib/
    ├── mock-data.ts             # Données factices (à remplacer par Prisma)
    ├── prisma.ts                # Client Prisma singleton
    └── utils.ts                 # Helpers (cn, formatPrice, STORE)
prisma/
├── schema.prisma                # Schéma complet (User, Product, Order, Repair, Review...)
└── seed.ts                      # Données initiales
```

## Modules implémentés

### Phase 1 — Socle ✅
- [x] Page d'accueil avec hero, catégories, produits vedettes, témoignages, CTA réparation, marques, contact, newsletter
- [x] Header avec recherche, navigation, panier, favoris, compte
- [x] Footer complet (bandeau confiance, infos magasin, réseaux, paiements)
- [x] TopBar avec coordonnées et liens rapides

### Phase 2 — E-Commerce 🟡 (UI prête, logique métier à brancher)
- [x] Catalogue : pages smartphones, tablettes, accessoires, occasions
- [x] Page produit avec galerie, sélecteurs (stockage, couleur), description
- [x] Filtres (marque, prix, état, stockage)
- [x] Panier (placeholder)
- [ ] Logique panier (Zustand ou cookies)
- [ ] Checkout Stripe
- [ ] Comptes clients (NextAuth)
- [ ] Wishlist persistée
- [ ] Comparateur de produits

### Phase 3 — Réparations 🟡
- [x] Hub réparations avec types de pannes
- [x] Formulaire de devis complet (appareil, panne, photos, coordonnées)
- [x] Suivi de réparation avec timeline (essayer `?ref=REP-2026-0458`)
- [x] Back-office réparations (liste avec statuts)
- [ ] Création de dossier en back-office
- [ ] Génération devis/factures PDF
- [ ] Notifications SMS/email automatiques
- [ ] QR code par dossier

### Phase 4 — Avancé 🟡
- [x] Page témoignages avec filtres
- [x] Formulaire de réclamation
- [x] Page contact avec formulaire et carte
- [ ] Synchronisation Google Places API / Facebook Graph API
- [ ] Programme de fidélité
- [ ] Chatbot IA pour estimation devis
- [ ] Recommandation produits IA
- [ ] Reprise d'ancien appareil

### Phase 5 — Optimisation
- [ ] SEO (sitemap, robots.txt, données structurées Schema.org)
- [ ] Performance (Core Web Vitals, ISR)
- [ ] Tests (Vitest + Playwright)
- [ ] PWA + notifications push
- [ ] Accessibilité WCAG 2.1 AA
- [ ] Documentation et formation

## Routes principales

| URL                              | Description                                   |
|----------------------------------|-----------------------------------------------|
| `/`                              | Page d'accueil                                |
| `/boutique`                      | Tout le catalogue                             |
| `/boutique/smartphones`          | Smartphones neufs                             |
| `/boutique/tablettes`            | Tablettes neuves                              |
| `/boutique/accessoires`          | Accessoires                                   |
| `/boutique/occasions`            | Reconditionnés et occasions                   |
| `/produit/[slug]`                | Fiche produit                                 |
| `/panier`                        | Panier (placeholder)                          |
| `/reparations`                   | Hub réparations                               |
| `/reparations/devis`             | Formulaire de devis gratuit                   |
| `/reparations/suivi?ref=...`     | Suivi de réparation                           |
| `/temoignages`                   | Avis clients                                  |
| `/contact`                       | Page contact                                  |
| `/reclamations`                  | Formulaire de réclamation                     |
| `/connexion` / `/inscription`    | Auth                                          |
| `/compte`                        | Espace client                                 |
| `/admin`                         | Back-office (dashboard)                       |
| `/admin/reparations`             | Gestion des réparations                       |
| `/admin/produits`                | Gestion du catalogue                          |

## Prochaines étapes recommandées

1. **Brancher la DB** — démarrer un PostgreSQL local (Docker), `npm run db:push`, `npm run db:seed`,
   puis remplacer les imports de `mock-data` par des appels Prisma server-side.
2. **Authentification** — installer `next-auth@beta` avec providers Google/Facebook + credentials,
   protéger `/admin` et `/compte` avec un middleware.
3. **Panier** — store côté client (Zustand) persistant en cookies/localStorage, route API
   `/api/cart` pour la fusion lors de la connexion.
4. **Checkout** — intégration Stripe Checkout Session, webhook pour passer les commandes en `PAID`.
5. **Réparations** — implémenter les API routes (`/api/reparations/devis`, `/api/reparations/[id]/status`)
   avec génération du numéro de dossier (`REP-YYYY-XXXX`) et envoi email/SMS.
6. **Intégrations externes** — Google Places API pour les avis, Facebook Graph API, Cloudinary
   pour les uploads photos.

## Conformité

- RGPD : bandeau cookies, pages CGV / Confidentialité / Mentions légales à rédiger
- HTTPS obligatoire en production
- 2FA pour les comptes admin (à activer dans NextAuth)
- Sauvegarde quotidienne automatique (config hébergeur)
