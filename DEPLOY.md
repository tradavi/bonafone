# Déploiement en production

Guide pour passer de SQLite/dev → PostgreSQL/Vercel. Tout reste fonctionnel en mode dégradé tant que les clés tierces ne sont pas configurées.

## 1. Base de données — bascule vers PostgreSQL

`prisma/schema.prisma` est en **SQLite par défaut** pour le dev local.
Avant de pousser sur Vercel, basculer le schéma en PostgreSQL avec :

```bash
npm run db:prod   # → provider = "postgresql" + directUrl, régénère le client
git add prisma/schema.prisma
git commit -m "Switch DB to postgres for deploy"
git push origin main   # Vercel rebuild en mode prod
```

Pour revenir en dev local après un déploiement :

```bash
npm run db:dev    # → provider = "sqlite", régénère le client
```

Autres commandes utiles :

```bash
npm run db:status   # affiche le mode actuel (sqlite ou postgresql)
```

> Les scripts sont **idempotents** : appeler `db:prod` deux fois ne fait rien la
> seconde fois. La logique vit dans [`scripts/db-switch.mjs`](scripts/db-switch.mjs).

Provisionner un Postgres managed (Vercel Postgres / Neon / Supabase). Récupérer
la connection string et la mettre dans `DATABASE_URL`. Pour Supabase, mettre
**aussi** `DIRECT_URL` (port 5432, sans pooler) — Prisma en a besoin pour les
migrations.

```bash
npm run db:generate
npx prisma db push   # crée les tables (ou `prisma migrate deploy` si vous gérez les migrations)
npm run db:seed      # comptes de test + produits — à NE PAS exécuter sur la prod réelle, juste sur staging
```

> Notes SQLite → Postgres
> - Les types `String` JSON-stringified (`Order.shippingAddress`, `Reclamation.attachments`) restent valides.
> - Tous les `@id @default(cuid())` fonctionnent à l'identique.
> - Les index existants sont portables.

## 2. Variables d'environnement Vercel

Copier `.env.example` puis renseigner :

| Variable | Obligatoire | Note |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string Postgres |
| `AUTH_URL` | ✅ | URL publique (ex : `https://bonafone.com`) |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | ✅ | `true` |
| `SECRETS_ENCRYPTION_KEY` | ✅ (prod) | Chiffre-at-rest les clés API stockées en DB. Générer 32 octets : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Sans cette variable, les clés sont en clair. **Ne jamais changer après chiffrement.** |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optionnel | Activate boutons Google |
| `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` | optionnel | Active boutons Facebook |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLIC_KEY` / `STRIPE_WEBHOOK_SECRET` | optionnel | Sans elles → mode démo (`status: "PAID"` direct) |
| `BREVO_API_KEY` / `BREVO_FROM_EMAIL` | optionnel | Sans elles → emails loggés en console |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | optionnel | Sans elles → SMS loggés en console |
| `NEXT_PUBLIC_STORE_*` | recommandé | Coordonnées affichées sur le site |

Toutes les intégrations tierces (Stripe, Brevo, Twilio, OAuth) sont conçues pour **no-op silencieux** quand les clés manquent — déployable sans crash dès le premier `git push`.

## 3. Déploiement Vercel

```bash
# Premier déploiement
npx vercel
# Ensuite : push sur main = preview/prod automatique
```

Configurer :
- **Build command** : `next build` (par défaut)
- **Install command** : `npm install`
- **Postinstall** : `prisma generate` (déjà géré via `@prisma/client` postinstall)
- **Node version** : 20+

Si Prisma demande une étape de migration : ajouter `"vercel-build": "prisma generate && next build"` dans `package.json`.

### 3.1 ⚡ Performance — config critique

**Symptôme** : TTFB de 3-5 secondes sur les pages publiques en prod.
**Cause habituelle** : DB et fonctions Vercel dans des régions différentes
(chaque query traverse l'Atlantique → 100-150ms × N queries par page).

1. **Région Vercel = Région Supabase** :
   - `vercel.json` est déjà committé avec `"regions": ["fra1"]` (Frankfurt, EU).
   - Si Supabase est en EU : OK. Si en US, changer pour `["iad1"]`.
   - Vérifier dans Vercel Dashboard → Project Settings → Functions → Region.

2. **`DATABASE_URL` = pooler Supabase (port 6543)** :
   ```
   postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```
   **`?pgbouncer=true&connection_limit=1` est OBLIGATOIRE** — sans ça, chaque
   serverless function ouvre une nouvelle connexion → épuisement rapide.

3. **`DIRECT_URL` = connexion directe (port 5432)** :
   ```
   postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```
   Utilisé par `prisma migrate` uniquement.

4. **Cache `unstable_cache` (déjà code)** : les queries publiques
   (`getStoreSettings`, `getFeaturedProducts`, `getBrandNames`,
   `getReviewsStats`, `getFeaturedReviews`) sont cachées 30 min à 1 h et
   invalidées via `updateTag` après chaque mutation admin. Une page publique
   ne touche normalement plus la DB après le premier hit post-déploiement.

## 4. Stripe — webhook prod

Une fois déployé :
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL : `${AUTH_URL}/api/stripe/webhook`
3. Events : `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`
4. Copier le `Signing secret` → `STRIPE_WEBHOOK_SECRET` dans Vercel

## 5. OAuth — callbacks à déclarer

- **Google** ([console.cloud.google.com](https://console.cloud.google.com/)) — Authorized redirect URI : `${AUTH_URL}/api/auth/callback/google`
- **Facebook** ([developers.facebook.com/apps](https://developers.facebook.com/apps/)) — Valid OAuth redirect URI : `${AUTH_URL}/api/auth/callback/facebook`

## 6. Vérifications post-déploiement

- [ ] `${AUTH_URL}/sitemap.xml` retourne du XML valide
- [ ] `${AUTH_URL}/robots.txt` retourne le robots
- [ ] `${AUTH_URL}/manifest.webmanifest` retourne du JSON
- [ ] `${AUTH_URL}/icon` et `${AUTH_URL}/apple-icon` renvoient du PNG
- [ ] Connexion Credentials fonctionne avec un compte de test
- [ ] Devis créé → mail Brevo reçu
- [ ] Commande passée (mode démo si pas de Stripe) → mail Brevo reçu, n° CMD-YYYY-XXXX généré
- [ ] Changement de statut réparation (admin) → mail + SMS si TELEPHONE/WHATSAPP
- [ ] Lighthouse SEO ≥ 90

## 7. Sécurité

- 🔐 `AUTH_SECRET` rotaté tous les 6 mois minimum
- 🔐 Stripe : utiliser **uniquement** des clés `sk_live_…` en prod
- 🔐 RGPD : pages CGV / Confidentialité / Mentions légales **à rédiger** avant ouverture publique
- 🔐 2FA admin : activer côté NextAuth (Phase ultérieure)
- 🔐 Backups Postgres : config hébergeur (point-in-time recovery recommandé)

## 8. Reste à faire (hors scope D1-D4)

- Codes promo (champ `promoCode` existe en DB)
- Pages CGV / Confidentialité / Mentions légales
- Reprise d'ancien appareil (Phase 4)
- Programme de fidélité (modèle `LoyaltyAccount` déjà en DB)
- Wishlist persistée DB (modèle `WishlistItem` déjà en DB)
- Chatbot IA estimation devis
- Tests automatisés (Vitest + Playwright)
- Génération PDF devis/factures (la page admin `/admin/reparations/[ref]/devis-print` existe déjà — il reste à wrapper en PDF côté serveur ou client)
