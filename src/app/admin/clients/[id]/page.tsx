import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Wrench,
  Heart,
  Star,
  Award,
  Calendar,
  Pencil,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getAdminClientById } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_STYLES, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { displayEmail, isSyntheticEmail } from "@/lib/synthetic-email";
import { deleteClientAdmin, resetClientPasswordAdmin } from "@/lib/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

// Badges niveau de fidelite — palettes contrastees pour le mode clair
const TIER_STYLES: Record<"bronze" | "silver" | "gold", string> = {
  bronze: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  silver: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  gold: "bg-amber-500/20 text-amber-400 border-amber-500/40",
};

const REPAIR_STATUS_STYLES: Record<string, string> = {
  RECU: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  DIAGNOSTIC: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  DEVIS_VALIDE: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  EN_REPARATION: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  ATTENTE_PIECE: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  TERMINE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  PRET_RECUPERATION: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  ATTENTE_RESTITUTION: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  RESTITUE: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  IRREPARABLE: "bg-primary/10 text-primary border-primary/30",
  DEMANDE_DEVIS: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};
const REPAIR_STATUS_LABEL: Record<string, string> = {
  RECU: "Reçu",
  DIAGNOSTIC: "Diagnostic",
  DEVIS_VALIDE: "Devis validé",
  EN_REPARATION: "En réparation",
  ATTENTE_PIECE: "Attente pièce",
  TERMINE: "Terminé",
  PRET_RECUPERATION: "À récupérer",
  ATTENTE_RESTITUTION: "Devis refusé",
  RESTITUE: "Restitué",
  IRREPARABLE: "Irréparable",
  DEMANDE_DEVIS: "Demande de devis",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; passwordReset?: string; error?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const client = await getAdminClientById(id);
  if (!client) return { title: "Client introuvable" };
  const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ").trim();
  return { title: fullName || client.email };
}

export default async function AdminClientDetailPage({ params, searchParams }: Props) {
  const { saved, passwordReset, error } = await searchParams;
  const { id } = await params;
  const client = await getAdminClientById(id);
  if (!client) notFound();

  const fullName =
    [client.firstName, client.lastName].filter(Boolean).join(" ").trim() || "Sans nom";
  const initials =
    (client.firstName?.[0] ?? "") + (client.lastName?.[0] ?? client.email[0] ?? "?");

  // CA cumulé = somme des paiements réels (paidAmount) sur toutes les
  // réparations du client. On utilise paidAmount plutôt que estimatedCost
  // pour refléter ce qui a vraiment été encaissé (vs ce qui était estimé).
  // Pour les anciennes réparations sans paidAmount mais en status RESTITUE,
  // on fallback sur finalCost ou estimatedCost.
  const totalSpent = client.repairs.reduce((s, r) => {
    if (r.paidAmount != null && r.paidAmount > 0) return s + r.paidAmount;
    // Fallback : si pas de paidAmount mais réparation restituée, on suppose
    // que le client a payé le montant final/estimé.
    if (r.status === "RESTITUE") {
      return s + (r.finalCost ?? r.estimatedCost ?? 0);
    }
    return s;
  }, 0);

  // Niveau de fidélité calculé dynamiquement sur le nombre de réparations
  // restituées (= terminées et rendues au client) :
  //  - 0-4 : bronze
  //  - 5-9 : silver
  //  - 10+ : gold
  const completedRepairs = client.repairs.filter((r) => r.status === "RESTITUE").length;
  const tier: "bronze" | "silver" | "gold" =
    completedRepairs >= 10 ? "gold" : completedRepairs >= 5 ? "silver" : "bronze";

  const canResetPassword = !isSyntheticEmail(client.email);
  const hasLinkedData = client.repairs.length > 0;

  return (
    <div className="space-y-4">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-primary transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux clients
      </Link>

      {/* Flash messages */}
      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>Modifications enregistrées.</div>
        </div>
      )}
      {passwordReset && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong>Nouveau mot de passe envoyé</strong> par email au client.
            Il pourra le modifier ensuite depuis son profil.
          </div>
        </div>
      )}
      {error && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-start gap-2 text-sm">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Identité */}
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center gap-5 flex-wrap">
        <div className="h-16 w-16 grid place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary font-extrabold text-xl uppercase shrink-0">
          {initials.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">{fullName}</h1>
          <div className="flex items-center gap-3 text-sm text-foreground-muted flex-wrap mt-1">
            {displayEmail(client.email) ? (
              <a
                href={`mailto:${displayEmail(client.email)}`}
                className="inline-flex items-center gap-1.5 hover:text-primary transition"
              >
                <Mail className="h-3.5 w-3.5" />
                {displayEmail(client.email)}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 italic text-foreground-subtle">
                <Mail className="h-3.5 w-3.5" />
                Pas d&apos;email
              </span>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-primary transition"
              >
                <Phone className="h-3.5 w-3.5" />
                {client.phone}
              </a>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Inscrit le {client.createdAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Brussels" })}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-foreground-muted uppercase tracking-wider">CA cumulé</div>
          <div className="text-2xl font-extrabold text-primary">{formatPrice(totalSpent)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/clients/${client.id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:border-primary rounded-lg text-sm font-semibold transition"
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </Link>

        {canResetPassword ? (
          <form action={resetClientPasswordAdmin}>
            <input type="hidden" name="id" value={client.id} />
            <ConfirmSubmitButton
              message={`Envoyer un nouveau mot de passe à ${displayEmail(client.email)} ?\n\nL'ancien mot de passe sera invalidé.`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 rounded-lg text-sm font-semibold transition"
            >
              <KeyRound className="h-4 w-4" />
              Réinitialiser le mot de passe
            </ConfirmSubmitButton>
          </form>
        ) : (
          <button
            type="button"
            disabled
            title="Ajoutez un email réel pour pouvoir réinitialiser le mot de passe"
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-semibold text-foreground-subtle cursor-not-allowed"
          >
            <KeyRound className="h-4 w-4" />
            Réinitialiser le mot de passe
          </button>
        )}

        {hasLinkedData ? (
          <button
            type="button"
            disabled
            title="Ce client a des commandes ou réparations rattachées — suppression bloquée"
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-semibold text-foreground-subtle cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        ) : (
          <form action={deleteClientAdmin} className="ml-auto">
            <input type="hidden" name="id" value={client.id} />
            <ConfirmSubmitButton
              message={`Supprimer définitivement ${fullName} ?\n\nCette action est irréversible.`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/40 rounded-lg text-sm font-semibold transition"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer le client
            </ConfirmSubmitButton>
          </form>
        )}
      </div>

      {/* Stats rapides — Commandes retiree (mode service reparation) */}
      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard icon={<Wrench className="h-5 w-5" />} label="Réparations" value={client.repairs.length} />
        <StatCard icon={<Heart className="h-5 w-5" />} label="Favoris" value={client.wishlist.length} />
        <StatCard icon={<Star className="h-5 w-5" />} label="Avis" value={client.reviews.length} />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Colonne principale */}
        <div className="space-y-4 min-w-0">

          {/* Réparations */}
          <Section title="Réparations" icon={<Wrench className="h-4 w-4" />}>
            {client.repairs.length === 0 ? (
              <Empty>Aucune réparation.</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {client.repairs.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/admin/reparations/${r.number}`}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-surface-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-primary">{r.number}</div>
                        <div className="text-sm font-medium truncate">
                          {r.brand} {r.model}
                        </div>
                        <div className="text-xs text-foreground-muted truncate">{r.issueType}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {r.finalCost != null ? (
                          <span className="font-semibold tabular-nums">
                            {formatPrice(r.finalCost)}
                          </span>
                        ) : r.estimatedCost != null ? (
                          <span className="font-medium text-foreground-muted tabular-nums">
                            ~ {formatPrice(r.estimatedCost)}
                          </span>
                        ) : null}
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                            REPAIR_STATUS_STYLES[r.status] ?? REPAIR_STATUS_STYLES.RECU
                          }`}
                        >
                          {REPAIR_STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Avis */}
          {client.reviews.length > 0 && (
            <Section title="Avis publiés" icon={<Star className="h-4 w-4" />}>
              <ul className="divide-y divide-border">
                {client.reviews.map((rv) => (
                  <li key={rv.id} className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < rv.rating ? "fill-amber-400 text-amber-400" : "text-zinc-600"
                            }`}
                          />
                        ))}
                      </div>
                      {rv.product && (
                        <Link
                          href={`/produit/${rv.product.slug}`}
                          className="text-xs text-foreground-muted hover:text-primary transition truncate"
                        >
                          {rv.product.name}
                        </Link>
                      )}
                      <span className="text-xs text-foreground-muted ml-auto shrink-0">
                        {rv.createdAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Brussels" })}
                      </span>
                    </div>
                    {rv.title && <div className="font-semibold text-sm">{rv.title}</div>}
                    <p className="text-sm text-foreground-muted line-clamp-3">{rv.comment}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Adresses */}
          <Section title="Adresses" icon={<MapPin className="h-4 w-4" />}>
            {client.addresses.length === 0 ? (
              <Empty>Aucune adresse enregistrée.</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {client.addresses.map((a) => (
                  <li key={a.id} className="p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      {a.label && <span className="font-semibold">{a.label}</span>}
                      {a.isDefault && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/30">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <div>{a.fullName}</div>
                    <div>{a.street}</div>
                    <div>
                      {a.postalCode} {a.city}
                    </div>
                    <div className="text-foreground-muted">{a.country}</div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Fidélité — calcul dynamique sur reparations restituees */}
          <Section title="Fidélité" icon={<Award className="h-4 w-4" />}>
            <div className="p-4 text-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Niveau</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${TIER_STYLES[tier]}`}
                >
                  <Award className="h-3.5 w-3.5" />
                  {tier === "gold" ? "Or" : tier === "silver" ? "Argent" : "Bronze"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Réparations restituées</span>
                <span className="font-bold tabular-nums">{completedRepairs}</span>
              </div>
              {/* Progression vers le niveau suivant */}
              {tier !== "gold" && (
                <div className="pt-2 border-t border-border">
                  <div className="text-xs text-foreground-muted mb-1.5">
                    {tier === "bronze"
                      ? `Plus que ${5 - completedRepairs} réparation${5 - completedRepairs > 1 ? "s" : ""} pour passer Argent`
                      : `Plus que ${10 - completedRepairs} réparation${10 - completedRepairs > 1 ? "s" : ""} pour passer Or`}
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${tier === "bronze" ? Math.min(100, (completedRepairs / 5) * 100) : Math.min(100, ((completedRepairs - 5) / 5) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              {tier === "gold" && (
                <div className="pt-2 border-t border-border text-xs text-foreground-muted text-center">
                  🏆 Client Or — niveau maximum atteint
                </div>
              )}
            </div>
          </Section>

          {/* Wishlist */}
          {client.wishlist.length > 0 && (
            <Section title="Favoris" icon={<Heart className="h-4 w-4" />}>
              <ul className="divide-y divide-border">
                {client.wishlist.map((w) => (
                  <li key={w.id}>
                    <Link
                      href={`/produit/${w.product.slug}`}
                      className="flex items-center gap-3 p-3 hover:bg-surface-2 transition"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-md bg-surface-2 border border-border overflow-hidden grid place-items-center">
                        {w.product.primaryImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={w.product.primaryImage}
                            alt={w.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Heart className="h-4 w-4 text-foreground-muted" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {w.product.brand?.name && (
                          <div className="text-[10px] text-foreground-muted uppercase tracking-widest font-semibold">
                            {w.product.brand.name}
                          </div>
                        )}
                        <div className="text-sm font-medium truncate">{w.product.name}</div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums shrink-0">
                        {formatPrice(w.product.price)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-sm font-bold">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs text-foreground-muted uppercase tracking-wider">{label}</div>
        <div className="text-xl font-extrabold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-6 text-center text-sm text-foreground-muted">{children}</div>;
}
