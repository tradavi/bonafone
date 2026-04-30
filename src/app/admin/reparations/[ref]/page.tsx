import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Smartphone,
  Tablet,
  Laptop,
  User,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Plus,
  Trash2,
  Save,
  FileText,
  AlertCircle,
  Pencil,
  Archive,
  Printer,
  Send,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import {
  updateRepairStatus,
  updateRepairCost,
  addRepairPart,
  updateInternalNotes,
  deleteRepairPart,
  updateRepairCore,
  archiveRepair,
  convertDevisToRepair,
  sendRepairQuote,
} from "@/lib/actions/repairs";

type Props = { params: Promise<{ ref: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { ref } = await params;
  return { title: `${ref}` };
}

const STATUS_FLOW = [
  { code: "DEMANDE_DEVIS", label: "Demande de devis (en ligne)" },
  { code: "RECU", label: "Reçu en boutique" },
  { code: "DIAGNOSTIC", label: "Diagnostic en cours" },
  { code: "DEVIS_VALIDE", label: "Devis validé" },
  { code: "EN_REPARATION", label: "En cours de réparation" },
  { code: "ATTENTE_PIECE", label: "En attente de pièce" },
  { code: "TERMINE", label: "Réparation terminée" },
  { code: "PRET_RECUPERATION", label: "Prêt à récupérer" },
  { code: "RESTITUE", label: "Restitué" },
  { code: "IRREPARABLE", label: "Irréparable" },
];

const STATUS_STYLES: Record<string, string> = {
  DEMANDE_DEVIS: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  RECU: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DIAGNOSTIC: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  DEVIS_VALIDE: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  EN_REPARATION: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ATTENTE_PIECE: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  TERMINE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PRET_RECUPERATION: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  RESTITUE: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  IRREPARABLE: "bg-primary/10 text-primary border-primary/30",
};

const DEVICE_ICON: Record<string, typeof Smartphone> = {
  SMARTPHONE: Smartphone,
  TABLETTE: Tablet,
  ORDINATEUR_PORTABLE: Laptop,
  AUTRE: Smartphone,
};

const CONTACT_ICON: Record<string, typeof Phone> = {
  EMAIL: Mail,
  TELEPHONE: Phone,
  WHATSAPP: MessageCircle,
};

export default async function AdminRepairDetailPage({ params }: Props) {
  const { ref } = await params;
  const repair = await prisma.repair.findUnique({
    where: { number: ref },
    include: {
      statusHistory: { orderBy: { createdAt: "desc" } },
      parts: { orderBy: { orderedAt: "desc" } },
      photos: true,
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  if (!repair) notFound();

  const Icon = DEVICE_ICON[repair.deviceType] ?? Smartphone;
  const PrefIcon = CONTACT_ICON[repair.contactPref] ?? Mail;
  const partsTotal = repair.parts.reduce((sum, p) => sum + p.cost, 0);
  const isDevisOnly = repair.status === "DEMANDE_DEVIS";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <Link
          href={isDevisOnly ? "/admin/devis" : "/admin/reparations"}
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {isDevisOnly ? "Retour aux demandes de devis" : "Retour à la liste"}
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 grid place-items-center bg-primary/10 border border-primary/20 text-primary rounded-xl">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <div className="text-xs text-foreground-muted">
                Dossier <span className="font-mono text-primary">{repair.number}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {repair.brand} {repair.model}
              </h1>
              <div className="text-sm text-foreground-muted mt-1">
                {repair.issueType} · Reçu le{" "}
                {repair.createdAt.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 text-sm font-bold rounded-full border ${
                STATUS_STYLES[repair.status] ?? STATUS_STYLES.RECU
              }`}
            >
              {STATUS_FLOW.find((s) => s.code === repair.status)?.label ??
                repair.status.replace(/_/g, " ")}
            </span>
            {!isDevisOnly && (
              <Link
                href={`/admin/reparations/${repair.number}/tickets`}
                target="_blank"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border hover:border-primary rounded-lg text-sm font-medium transition"
              >
                <Printer className="h-4 w-4" />
                Tickets
              </Link>
            )}
            <Link
              href={`/admin/reparations/${repair.number}/devis-print`}
              target="_blank"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border hover:border-primary rounded-lg text-sm font-medium transition"
            >
              <FileText className="h-4 w-4" />
              Devis PDF
            </Link>
          </div>
        </div>
      </div>

      {isDevisOnly && (
        <div className="bg-surface border border-amber-500/40 bg-amber-500/5 rounded-2xl p-5 flex items-start gap-3 flex-wrap">
          <div className="h-10 w-10 grid place-items-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold mb-1">Demande de devis en ligne</div>
            <p className="text-sm text-foreground-muted">
              L&apos;appareil n&apos;a pas encore été déposé en boutique. Convertir le dossier en
              réparation déclenchera l&apos;étape <strong>Reçu</strong>, enregistrera la date de
              dépôt et notifiera le client.
            </p>
          </div>
          <form action={convertDevisToRepair}>
            <input type="hidden" name="repairId" value={repair.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
            >
              <Smartphone className="h-4 w-4" />
              Convertir en réparation
            </button>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client */}
          <Card title="Client" icon={User}>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-3 text-sm">
              <Row label="Nom" value={repair.customerName} />
              <Row label="Email" value={repair.customerEmail} icon={Mail} />
              <Row label="Téléphone" value={repair.customerPhone} icon={Phone} />
              <Row
                label="Mode de contact"
                value={repair.contactPref}
                icon={PrefIcon}
              />
              {repair.user && (
                <Row
                  label="Compte client"
                  value={`${repair.user.firstName ?? ""} ${repair.user.lastName ?? ""}`.trim() || repair.user.email}
                />
              )}
              {repair.preferredDropAt && (
                <Row
                  label="Dépôt souhaité"
                  value={repair.preferredDropAt.toLocaleString("fr-FR")}
                  icon={Calendar}
                />
              )}
              {repair.estimatedReadyAt && (
                <Row
                  label="Disponible le"
                  value={repair.estimatedReadyAt.toLocaleString("fr-FR")}
                  icon={Calendar}
                />
              )}
              {repair.imei && <Row label="IMEI" value={repair.imei} />}
            </dl>
          </Card>

          {/* Description panne */}
          <Card title="Diagnostic">
            <div className="text-sm font-semibold mb-2">Type de panne</div>
            <p className="text-sm text-foreground-muted mb-5">{repair.issueType}</p>
            <div className="text-sm font-semibold mb-2">Description du client</div>
            <p className="text-sm text-foreground-muted whitespace-pre-line">
              {repair.issueDescription}
            </p>
          </Card>

          {/* Photos envoyées par le client */}
          {repair.photos.length > 0 && (
            <Card title={`Photos jointes (${repair.photos.length})`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {repair.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-square rounded-lg overflow-hidden border border-border bg-surface-2 hover:border-primary transition group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption ?? "Photo dossier"}
                      className="h-full w-full object-cover group-hover:scale-105 transition"
                    />
                  </a>
                ))}
              </div>
              <p className="text-[11px] text-foreground-muted mt-3">
                Cliquez sur une vignette pour l&apos;ouvrir en grand.
              </p>
            </Card>
          )}

          {/* Édition complète du dossier */}
          <details className="bg-surface border border-border rounded-2xl p-5 group">
            <summary className="cursor-pointer font-extrabold tracking-tight flex items-center gap-2 list-none">
              <Pencil className="h-4 w-4 text-primary" />
              Modifier le dossier
              <span className="ml-auto text-xs text-foreground-muted group-open:hidden">Ouvrir</span>
              <span className="ml-auto text-xs text-foreground-muted hidden group-open:inline">Fermer</span>
            </summary>
            <form action={updateRepairCore} className="mt-4 space-y-4">
              <input type="hidden" name="repairId" value={repair.id} />
              <div>
                <h3 className="text-sm font-bold mb-2 text-foreground-muted uppercase tracking-wider">
                  Client
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Nom complet" name="customerName" required defaultValue={repair.customerName} className="md:col-span-2" />
                  <Field label="Email (optionnel)" name="customerEmail" type="email" defaultValue={repair.customerEmail ?? ""} />
                  <Field label="Téléphone" name="customerPhone" type="tel" required defaultValue={repair.customerPhone} />
                  <Select label="Mode de contact" name="contactPref" defaultValue={repair.contactPref}>
                    <option value="EMAIL">Email</option>
                    <option value="TELEPHONE">Téléphone</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </Select>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2 text-foreground-muted uppercase tracking-wider">
                  Appareil
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <Select label="Type" name="deviceType" required defaultValue={repair.deviceType}>
                    <option value="SMARTPHONE">Smartphone</option>
                    <option value="TABLETTE">Tablette</option>
                    <option value="ORDINATEUR_PORTABLE">Ordinateur portable</option>
                    <option value="AUTRE">Autre</option>
                  </Select>
                  <Field label="IMEI" name="imei" defaultValue={repair.imei ?? ""} />
                  <Field label="Marque" name="brand" required defaultValue={repair.brand} />
                  <Field label="Modèle" name="model" required defaultValue={repair.model} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2 text-foreground-muted uppercase tracking-wider">
                  Panne
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Type de panne" name="issueType" required defaultValue={repair.issueType} className="md:col-span-2" />
                </div>
                <label className="block mt-3">
                  <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
                    Description (visible côté client)
                  </span>
                  <textarea
                    name="issueDescription"
                    rows={4}
                    required
                    defaultValue={repair.issueDescription}
                    className={inputCls}
                  />
                </label>
              </div>
              <div>
                <h3 className="text-sm font-bold mb-2 text-foreground-muted uppercase tracking-wider">
                  Dates
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <Field
                    label="Dépôt souhaité"
                    name="preferredDropAt"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(repair.preferredDropAt)}
                  />
                  <Field
                    label="Disponible le (estimé)"
                    name="estimatedReadyAt"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(repair.estimatedReadyAt)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_16px_var(--primary-glow)]"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </details>

          {/* Changement de statut */}
          {!isDevisOnly && (
            <Card title="Changer le statut">
              <form action={updateRepairStatus} className="space-y-3">
                <input type="hidden" name="repairId" value={repair.id} />
                <div className="grid md:grid-cols-2 gap-3">
                  <select name="status" defaultValue={repair.status} className={inputCls}>
                    {STATUS_FLOW.filter((s) => s.code !== "DEMANDE_DEVIS").map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  name="comment"
                  rows={2}
                  placeholder="Commentaire optionnel (visible côté client)"
                  className={inputCls}
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_16px_var(--primary-glow)]"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer le statut
                </button>
              </form>
            </Card>
          )}

          {/* Pièces */}
          {!isDevisOnly && (
          <Card
            title={`Pièces commandées (${repair.parts.length})`}
            right={
              partsTotal > 0 ? (
                <span className="text-sm font-bold text-primary">
                  Total : {formatPrice(partsTotal)}
                </span>
              ) : null
            }
          >
            {repair.parts.length === 0 ? (
              <p className="text-sm text-foreground-muted text-center py-4">
                Aucune pièce pour ce dossier.
              </p>
            ) : (
              <div className="space-y-2 mb-5">
                {repair.parts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-foreground-muted">
                        {p.supplier ?? "—"}
                        {p.estimatedDays !== null && ` · délai ${p.estimatedDays}j`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatPrice(p.cost)}</span>
                      <form action={deleteRepairPart}>
                        <input type="hidden" name="partId" value={p.id} />
                        <button
                          type="submit"
                          aria-label="Supprimer"
                          className="p-1.5 hover:bg-primary/10 hover:text-primary rounded transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form action={addRepairPart} className="grid md:grid-cols-[1fr_140px_100px_100px_auto] gap-2 items-end">
              <input type="hidden" name="repairId" value={repair.id} />
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Pièce</label>
                <input name="name" required placeholder="Écran OEM, Batterie..." className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Fournisseur</label>
                <input name="supplier" placeholder="DVK, etc." className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Coût (€)</label>
                <input
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Délai (j)</label>
                <input name="estimatedDays" type="number" min="0" className={inputCls} />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1 px-3 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </form>
          </Card>
          )}

          {/* Notes internes — toujours visible (utile dès la demande de devis) */}
          <Card title="Notes internes" icon={AlertCircle}>
            <form action={updateInternalNotes} className="space-y-2">
              <input type="hidden" name="repairId" value={repair.id} />
              <textarea
                name="internalNotes"
                rows={4}
                defaultValue={repair.internalNotes ?? ""}
                placeholder="Notes pour l'équipe (non visibles côté client)..."
                className={inputCls}
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border hover:border-primary rounded-lg text-sm font-semibold transition"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </form>
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Coûts */}
          <Card title="Coûts">
            <form action={updateRepairCost} className="space-y-3">
              <input type="hidden" name="repairId" value={repair.id} />
              <div>
                <label className="block text-xs text-foreground-muted mb-1">
                  Coût estimé (devis)
                </label>
                <div className="relative">
                  <input
                    name="estimatedCost"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={repair.estimatedCost ?? ""}
                    className={inputCls + " pr-10"}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">
                    €
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">
                  Coût final (facture)
                </label>
                <div className="relative">
                  <input
                    name="finalCost"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={repair.finalCost ?? ""}
                    className={inputCls + " pr-10"}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">
                    €
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </form>

            {partsTotal > 0 && repair.estimatedCost && (
              <div className="mt-4 pt-4 border-t border-border text-xs text-foreground-muted space-y-1">
                <div className="flex justify-between">
                  <span>Pièces</span>
                  <span>{formatPrice(partsTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Main d&apos;œuvre estimée</span>
                  <span>{formatPrice(repair.estimatedCost - partsTotal)}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Envoyer le devis au client */}
          <Card title="Envoyer la réponse" icon={Send}>
            {!repair.customerEmail ? (
              <p className="text-xs text-foreground-muted">
                Aucun email client renseigné — impossible d&apos;envoyer le devis par mail.
              </p>
            ) : repair.estimatedCost == null ? (
              <p className="text-xs text-foreground-muted">
                Définissez d&apos;abord un <strong>coût estimé</strong> ci-dessus.
              </p>
            ) : (
              <form action={sendRepairQuote} className="space-y-3">
                <input type="hidden" name="repairId" value={repair.id} />
                <p className="text-xs text-foreground-muted">
                  Le client recevra un email récapitulant le devis (montant estimé
                  {repair.parts.length > 0 ? " et liste des pièces" : ""}) à{" "}
                  <strong className="text-foreground">{repair.customerEmail}</strong>.
                </p>
                <div>
                  <label className="block text-xs text-foreground-muted mb-1">
                    Message complémentaire (optionnel)
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Délai, garantie, recommandations…"
                    className={inputCls + " resize-none"}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_18px_var(--primary-glow)]"
                >
                  <Send className="h-4 w-4" />
                  Envoyer la réponse
                </button>
              </form>
            )}
          </Card>

          {/* Zone dangereuse */}
          <div className="bg-surface border border-primary/30 rounded-2xl p-5">
            <h2 className="font-extrabold tracking-tight mb-1 text-primary flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archiver
            </h2>
            <p className="text-xs text-foreground-muted mb-3">
              Passe le dossier en <strong>RESTITUE</strong> et le sort de la liste des actifs. Réversible via un changement de statut.
            </p>
            <form action={archiveRepair}>
              <input type="hidden" name="repairId" value={repair.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/40 rounded-lg text-sm font-semibold transition"
              >
                <Archive className="h-4 w-4" />
                Archiver le dossier
              </button>
            </form>
          </div>

          {/* Historique */}
          <Card title="Historique">
            {repair.statusHistory.length === 0 ? (
              <p className="text-sm text-foreground-muted text-center py-4">
                Aucun événement.
              </p>
            ) : (
              <ol className="space-y-3">
                {repair.statusHistory.map((event, i) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="relative">
                      <div
                        className={`h-2.5 w-2.5 rounded-full mt-1.5 ${
                          i === 0 ? "bg-primary shadow-[0_0_8px_var(--primary-glow)]" : "bg-border-strong"
                        }`}
                      />
                      {i < repair.statusHistory.length - 1 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-full bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="text-sm font-semibold">
                        {event.status.replace(/_/g, " ")}
                      </div>
                      {event.comment && (
                        <div className="text-xs text-foreground-muted mt-0.5">
                          {event.comment}
                        </div>
                      )}
                      <time className="text-[10px] text-foreground-subtle mt-1 block">
                        {event.createdAt.toLocaleString("fr-FR")}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

function Card({
  title,
  icon: Icon,
  right,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-extrabold tracking-tight flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="font-medium flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-foreground-muted" />}
        {value ?? "—"}
      </dd>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className={inputCls}
      />
    </label>
  );
}

function Select({
  label,
  name,
  required,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <select name={name} required={required} defaultValue={defaultValue} className={inputCls}>
        {children}
      </select>
    </label>
  );
}

function toDateTimeLocal(d: Date | null): string {
  if (!d) return "";
  // Format pour <input type="datetime-local"> : YYYY-MM-DDTHH:mm (heure locale)
  const tzOffset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}
