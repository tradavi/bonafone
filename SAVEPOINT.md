# Bonafone — Savepoint

État du projet au moment de l'arrêt. À lire avant de reprendre.

## Build : ✅ vert

```bash
npx tsc --noEmit   # OK
npx next build     # OK
```

## Comptes de test (déjà en DB)

| Rôle | Email | Mot de passe |
|---|---|---|
| 👑 Admin | `admin@bonafone.com` | `admin1234` |
| 👤 Client | `client@example.com` | `client1234` |

## Phases terminées

### ✅ Phase A — Base de données
- Prisma + SQLite (`prisma/dev.db`)
- 20+ modèles (User, Product, Order, Repair, Review, Reclamation, etc.)
- Couche d'accès `src/lib/queries.ts`
- Server Actions formulaires : devis, contact, réclamations, newsletter
- Toutes les pages publiques + admin tirent les vraies données DB
- Pages admin en `force-dynamic`, pages publiques en `revalidate=60`

### ✅ Phase B1 — Authentification (NextAuth v5)
- Provider Credentials avec bcrypt + JWT sessions
- Middleware `src/middleware.ts` qui protège `/admin/*` (rôle ADMIN) et `/compte/*` (auth)
- Pages connexion + inscription fonctionnelles (Server Actions)
- Header dynamique avec UserMenu (avatar + dropdown)
- Auto-connexion après inscription
- RBAC vérifié : un CLIENT est redirigé en tentant `/admin`
- Boutons Google/Facebook désactivés ("bientôt") — à activer en Phase B2

### ✅ Phase C — Workflow réparations complet
- Page admin détail `/admin/reparations/[ref]` : changer statut, éditer coûts, gérer pièces, notes internes, timeline
- Server Actions `repairs.ts` : updateRepairStatus, updateRepairCost, addRepairPart, deleteRepairPart, updateInternalNotes
- Devis PDF imprimable `/admin/reparations/[ref]/devis-print` (header/footer auto-masqués via `print:hidden`)
- Page client `/compte/reparations` qui liste les dossiers de l'utilisateur
- Devis créé par un client connecté → automatiquement rattaché à son compte
- 2 réparations seed rattachées à `client@example.com` (REP-2026-0454 et REP-2026-0458)

### ✅ Phase D1 — Panier + Checkout Stripe (terminé)

**Panier (déjà fait au précédent passage)**
- `zustand` + `stripe` SDK installés
- **Cart store** [`src/lib/cart-store.ts`](src/lib/cart-store.ts) — Zustand persisté localStorage (`useCart`, `useCartCount`, `useCartSubtotal`)
- **`AddToCartButton`** [`src/components/cart/add-to-cart-button.tsx`](src/components/cart/add-to-cart-button.tsx) — variantes `icon` + `full`
- **`CartCounter`** [`src/components/cart/cart-counter.tsx`](src/components/cart/cart-counter.tsx) — badge header, hydration-safe
- **`CartView`** [`src/components/cart/cart-view.tsx`](src/components/cart/cart-view.tsx) — page panier complète, livraison gratuite ≥ 50€
- **`lib/stripe.ts`** — client Stripe lazy avec mode démo si `STRIPE_SECRET_KEY` absent

**Checkout (nouveau)**
- **Helpers DB** [`src/lib/queries.ts`](src/lib/queries.ts) — `generateNextOrderNumber` (CMD-YYYY-XXXX), `getOrderByNumber`, `getOrdersByUser`
- **Server actions** [`src/lib/actions/checkout.ts`](src/lib/actions/checkout.ts) — `createOrder` (validation Zod, re-vérif prix/stock, transaction Prisma atomique : Order + OrderItems + décrément stock, mode démo `status: "PAID"` ou Checkout Session Stripe sinon) + `cancelPendingOrder` (idempotent, restaure le stock)
- **Page `/checkout`** [`src/app/checkout/page.tsx`](src/app/checkout/page.tsx) + [`src/components/checkout/checkout-view.tsx`](src/components/checkout/checkout-view.tsx) — formulaire d'adresse client, pré-rempli si connecté, redirection externe si Stripe / interne si démo
- **Page `/checkout/success`** [`src/app/checkout/success/page.tsx`](src/app/checkout/success/page.tsx) — récap commande + [`<ClearCartOnMount />`](src/components/checkout/clear-cart-on-mount.tsx)
- **Page `/checkout/cancelled`** [`src/app/checkout/cancelled/page.tsx`](src/app/checkout/cancelled/page.tsx) — restaure le stock via `cancelPendingOrder(ref)`
- **Webhook Stripe** [`src/app/api/stripe/webhook/route.ts`](src/app/api/stripe/webhook/route.ts) — vérif signature, `checkout.session.completed` → `PAID`, `expired`/`async_payment_failed` → `CANCELLED` + restauration stock
- **Espace client** [`src/app/compte/commandes/page.tsx`](src/app/compte/commandes/page.tsx) — listing avec badges de statut

### Variables d'env Stripe (mode démo si absentes)

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."   # depuis "stripe listen" en local
```

Tester en local avec : `npx stripe listen --forward-to localhost:3000/api/stripe/webhook`.

### ✅ Phase D2 — Notifications email/SMS

- **Module** [`src/lib/notifications.ts`](src/lib/notifications.ts) — `sendEmail` (Brevo REST), `sendSms` (Twilio REST), tolérant aux clés manquantes (no-op + log si absentes). Templates HTML : devis reçu, confirmation commande, statut réparation (email + SMS), bienvenue inscription, réclamation reçue.
- **Hooks branchés** :
  - `createDevis` → email "Demande reçue" au client
  - `createOrder` (mode démo) → email confirmation directe
  - Webhook Stripe `checkout.session.completed` → email confirmation après paiement (idempotent)
  - `updateRepairStatus` → email + SMS si `contactPref` ∈ {TELEPHONE, WHATSAPP}
  - `createReclamation` → email accusé de réception
  - `signUpAction` → email de bienvenue
- Sans `BREVO_API_KEY` / `TWILIO_*` → mode démo (logs uniquement, build et UX intacts)

### ✅ Phase D3 — OAuth Google + Facebook

- Providers conditionnels dans [`src/auth.ts`](src/auth.ts) — `Google()` + `Facebook()` enregistrés uniquement si `AUTH_GOOGLE_ID/SECRET` et `AUTH_FACEBOOK_ID/SECRET` sont présents
- Callback JWT upsert le user en DB (création automatique sur premier sign-in OAuth) puis injecte `id` + `role` dans le token
- Server actions [`signInWithGoogle`](src/lib/actions/auth.ts), [`signInWithFacebook`](src/lib/actions/auth.ts)
- Page [`/connexion`](src/app/(auth)/connexion/page.tsx) — boutons OAuth visibles uniquement quand le provider est configuré (les flags `isGoogleEnabled`, `isFacebookEnabled` sont exportés depuis `auth.ts`)
- Vars ajoutées dans `.env.example` avec instructions de configuration des callbacks

### ✅ Page détail commande client
- [`src/app/compte/commandes/[ref]/page.tsx`](src/app/compte/commandes/[ref]/page.tsx) — items, adresse de livraison, suivi colis (si rempli), récap paiement, badge statut
- Authz stricte : `notFound()` si commande absente OU pas propriétaire (on ne révèle pas l'existence)
- Cartes du listing rendues cliquables, constantes statut promues dans [`src/lib/order-status.ts`](src/lib/order-status.ts)

### ✅ Phase D4 — SEO + PWA + production

- **SEO**
  - [`src/app/sitemap.ts`](src/app/sitemap.ts) — pages statiques + tous les produits (`getAllProductSlugs`)
  - [`src/app/robots.ts`](src/app/robots.ts) — disallow `/admin`, `/compte`, `/api`, `/checkout/*`
  - [`src/app/layout.tsx`](src/app/layout.tsx) — `metadataBase`, `openGraph`, `twitter`, `robots`, `viewport.themeColor`
  - [`src/components/seo/json-ld.tsx`](src/components/seo/json-ld.tsx) — helpers `localBusinessSchema`, `productSchema`, `breadcrumbSchema`
  - JSON-LD branché : LocalBusiness sur la home, Product + BreadcrumbList sur `/produit/[slug]`
- **PWA / icônes**
  - [`src/app/manifest.ts`](src/app/manifest.ts) — manifest dynamique
  - [`src/app/icon.tsx`](src/app/icon.tsx) (32×32) + [`src/app/apple-icon.tsx`](src/app/apple-icon.tsx) (180×180) — générés via `next/og`
  - [`src/app/opengraph-image.tsx`](src/app/opengraph-image.tsx) — image OG par défaut 1200×630
- **Déploiement** : guide complet [`DEPLOY.md`](DEPLOY.md) — bascule SQLite → Postgres, vars Vercel, callbacks OAuth, webhook Stripe, checklist post-deploy. **Aucun déploiement réel effectué** — c'est une étape user-driven.

## Phases optionnelles (futur)

## Reprendre

Au démarrage :

```bash
cd C:\Users\mohci\Desktop\ecommerce-reparations
npm run dev
```

Toutes les phases planifiées (D1 → D4) sont **terminées** côté code et build vert. Pour mettre en prod : suivre [`DEPLOY.md`](DEPLOY.md).

Pistes optionnelles (hors scope initial) — voir liste détaillée en bas de DEPLOY.md.

## Fichiers clés (référence)

```
src/
├── auth.ts                                    # Config NextAuth v5
├── middleware.ts                              # Protection /admin et /compte
├── lib/
│   ├── prisma.ts                              # Client Prisma singleton
│   ├── queries.ts                             # Couche lecture DB
│   ├── stripe.ts                              # Stripe lazy (Phase D1)
│   ├── cart-store.ts                          # Zustand (Phase D1)
│   ├── utils.ts                               # cn(), formatPrice(), STORE
│   └── actions/
│       ├── auth.ts                            # signIn / signUp / signOut
│       ├── devis.ts                           # createDevis
│       ├── repairs.ts                         # updateStatus, updateCost, etc.
│       ├── contact.ts
│       ├── reclamations.ts
│       └── newsletter.ts
├── components/
│   ├── cart/                                  # AddToCartButton, CartCounter, CartView
│   ├── home/                                  # Hero, Categories, Featured, etc.
│   ├── layout/                                # Header, Footer, TopBar, NavLinks, UserMenu, SidebarNav
│   └── ui/                                    # Logo, ProductCard
└── app/
    ├── (auth)/                                # /connexion, /inscription
    ├── admin/                                 # Back-office complet
    │   ├── reparations/[ref]/                 # Page détail dossier
    │   │   └── devis-print/                   # Devis PDF imprimable
    │   └── ...
    ├── api/auth/[...nextauth]/                # NextAuth handler
    ├── boutique/                              # Catalogue
    ├── compte/                                # Espace client
    ├── produit/[slug]/                        # Fiche produit
    ├── reparations/                           # Hub + devis + suivi + confirmation
    └── ...

prisma/
├── schema.prisma                              # 20+ modèles
├── seed.ts                                    # Comptes test + produits + avis + réparations
└── dev.db                                     # SQLite (gitignore)
```
