import Link from "next/link";
import { Upload, ShieldCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { createReclamation } from "@/lib/actions/reclamations";

export const metadata = { title: "Réclamations" };

type Props = { searchParams: Promise<{ error?: string; sent?: string }> };

export default async function ReclamationsPage({ searchParams }: Props) {
  const { error, sent } = await searchParams;
  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
            Réclamations
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Faire une réclamation
          </h1>
          <p className="text-foreground-muted">
            Nous traitons toute réclamation sous{" "}
            <strong className="text-primary">48h</strong>.
          </p>
        </div>

        {sent && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-400">
                Réclamation enregistrée — n° {sent}
              </div>
              <div className="text-sm text-foreground-muted">
                Notre équipe vous répond sous 48h.{" "}
                <Link href={`/reclamations`} className="text-primary underline">
                  Faire une autre réclamation
                </Link>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-primary">Formulaire incomplet</div>
              <div className="text-sm text-foreground-muted">{error}</div>
            </div>
          </div>
        )}

        <form
          action={createReclamation}
          encType="multipart/form-data"
          className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-5"
        >
          {/* Anti-spam : timestamp + honeypot (voir lib/spam-check.ts) */}
          <input type="hidden" name="formRenderedAt" value={Date.now()} />
          <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden opacity-0 pointer-events-none">
            <label htmlFor="website-recl">Site web (ne pas remplir)</label>
            <input id="website-recl" type="text" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <Field label="Type de réclamation" name="type" required>
            <select name="type" required className={inputCls}>
              <option value="">— Sélectionnez —</option>
              <option value="COMMANDE">Commande</option>
              <option value="REPARATION">Réparation</option>
              <option value="LIVRAISON">Livraison</option>
              <option value="PRODUIT_DEFECTUEUX">Produit défectueux</option>
              <option value="AUTRE">Autre</option>
            </select>
          </Field>

          <Field label="Numéro de commande ou de réparation" name="orderRef">
            <input
              name="orderRef"
              type="text"
              placeholder="CMD-2026-XXXX ou REP-2026-XXXX"
              className={inputCls}
            />
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email" name="email" required>
              <input name="email" type="email" required className={inputCls} />
            </Field>
            <Field label="Téléphone" name="phone">
              <input name="phone" type="tel" className={inputCls} />
            </Field>
          </div>

          <Field label="Description détaillée" name="description" required>
            <textarea
              name="description"
              rows={6}
              required
              placeholder="Expliquez-nous le problème rencontré..."
              className={inputCls}
            />
          </Field>

          {/* Photos justificatives (jusqu'à 5) — pattern identique au formulaire devis */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Photos justificatives <span className="text-foreground-muted text-xs">(optionnel — jusqu&apos;à 5)</span>
            </label>
            <label className="flex flex-col items-center gap-2 px-4 py-6 bg-surface-2 border border-dashed border-border hover:border-primary rounded-lg text-sm text-foreground-muted cursor-pointer transition">
              <Upload className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">Cliquez pour ajouter des photos</span>
              <span className="text-xs">jpg, png, webp · max 8 Mo par image</span>
              <input
                name="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                multiple
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-surface-2 border border-border rounded-lg">
            <div className="flex items-start gap-2.5">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Réponse sous 48h</div>
                <div className="text-xs text-foreground-muted">Engagement contractuel</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Suivi unique</div>
                <div className="text-xs text-foreground-muted">Numéro REC-2026-XXXX</div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-4 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_32px_var(--primary-glow)]"
          >
            Envoyer la réclamation
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

function Field({
  label,
  name,
  required,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}
