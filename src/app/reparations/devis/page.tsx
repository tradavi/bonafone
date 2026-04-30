import { Upload, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import { createDevis } from "@/lib/actions/devis";

export const metadata = {
  title: "Demande de devis gratuit",
  description: "Décrivez votre panne et recevez un devis gratuit sous 24h.",
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function DevisPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
            Formulaire
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Devis gratuit
          </h1>
          <p className="text-foreground-muted">
            Remplissez ce formulaire, on revient vers vous sous <strong className="text-primary">24h ouvrées</strong>.
          </p>
        </div>

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
          action={createDevis}
          encType="multipart/form-data"
          className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-7"
        >
          {/* Appareil */}
          <Section title="1. Votre appareil">
            <Field label="Type d'appareil" name="deviceType" required>
              <select name="deviceType" className={inputCls} required>
                <option value="">— Sélectionnez —</option>
                <option value="SMARTPHONE">Smartphone</option>
                <option value="TABLETTE">Tablette</option>
                <option value="ORDINATEUR_PORTABLE">Ordinateur portable</option>
                <option value="AUTRE">Autre</option>
              </select>
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Marque" name="brand" required>
                <input name="brand" type="text" placeholder="Apple, Samsung..." className={inputCls} required />
              </Field>
              <Field label="Modèle" name="model" required>
                <input name="model" type="text" placeholder="iPhone 14 Pro, Galaxy S24..." className={inputCls} required />
              </Field>
            </div>
          </Section>

          {/* Panne */}
          <Section title="2. Nature de la panne">
            <Field label="Type de panne" name="issueType" required>
              <select name="issueType" className={inputCls} required>
                <option value="">— Sélectionnez —</option>
                <option>Écran cassé</option>
                <option>Batterie</option>
                <option>Bouton / Connecteur</option>
                <option>Carte mère</option>
                <option>Dégât des eaux</option>
                <option>Logiciel</option>
                <option>Autre</option>
              </select>
            </Field>
            <Field label="Décrivez le problème" name="issueDescription" required>
              <textarea
                name="issueDescription"
                rows={4}
                placeholder="Quand est-ce arrivé ? Que se passe-t-il ?"
                className={inputCls}
                required
              />
            </Field>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Photos de l&apos;appareil <span className="text-foreground-muted text-xs">(optionnel — jusqu&apos;à 5)</span>
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
          </Section>

          {/* Coordonnées */}
          <Section title="3. Vos coordonnées">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nom complet" name="customerName" required>
                <input name="customerName" type="text" className={inputCls} required />
              </Field>
              <Field label="Téléphone" name="customerPhone" required>
                <input name="customerPhone" type="tel" className={inputCls} required />
              </Field>
            </div>
            <Field label="Email" name="customerEmail" required>
              <input name="customerEmail" type="email" className={inputCls} required />
            </Field>
            <Field label="Mode de contact préféré" name="contactPref">
              <div className="flex gap-4 flex-wrap">
                {[
                  { v: "EMAIL", l: "Email" },
                  { v: "TELEPHONE", l: "Téléphone" },
                  { v: "WHATSAPP", l: "WhatsApp" },
                ].map(({ v, l }) => (
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="contactPref" value={v} defaultChecked={v === "EMAIL"} className="accent-primary" />
                    {l}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Date et heure préférée pour déposer l'appareil" name="preferredDropAt">
              <input name="preferredDropAt" type="datetime-local" className={inputCls} />
            </Field>
          </Section>

          {/* Engagement */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-surface-2 border border-border rounded-lg">
            <div className="flex items-start gap-2.5">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">Devis sous 24h</div>
                <div className="text-xs text-foreground-muted">Réponse rapide par email/SMS</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">100% gratuit</div>
                <div className="text-xs text-foreground-muted">Sans engagement</div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-4 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_32px_var(--primary-glow)]"
          >
            Envoyer ma demande de devis
          </button>
          <p className="text-xs text-foreground-subtle text-center">
            En soumettant ce formulaire, vous acceptez notre politique de confidentialité (RGPD).
          </p>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-bold text-base mb-4 pb-2 border-b border-border flex items-center gap-2">
        <span className="h-1 w-8 bg-primary rounded-full" />
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

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
