import { MapPin, Phone, Mail, Clock, MessageCircle, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { getStoreSettings, getStoreApiKeys } from "@/lib/store-settings";
import { sendContactMessage } from "@/lib/actions/contact";

export const metadata = { title: "Contact" };

type Props = { searchParams: Promise<{ error?: string; sent?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const { error, sent } = await searchParams;
  const store = await getStoreSettings();
  const keys = await getStoreApiKeys();
  const whatsappDigits = store.whatsapp.replace(/\D/g, "");

  // URL d'embed Google Maps : si une clé API est configurée, on utilise
  // "Maps Embed API" qui prend simplement l'adresse en query. Sinon fallback
  // sur le mode "place" public qui marche sans clé mais avec moins d'options.
  const mapsApiKey = keys.googleMapsApiKey;
  const embedUrl = mapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapsApiKey)}&q=${encodeURIComponent(store.address)}`
    : `https://www.google.com/maps?q=${encodeURIComponent(store.address)}&output=embed`;

  return (
    <>
      <div className="bg-surface/40 border-b border-border py-14">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
            Contact
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Contactez-nous
          </h1>
          <p className="text-foreground-muted">
            Notre équipe est à votre disposition du lundi au samedi.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 space-y-6">
        {/* Cartes infos + formulaire (sur deux colonnes) */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne gauche : infos */}
          <div className="space-y-3">
            <ContactCard icon={MapPin} title="Adresse">
              <a href={store.gmaps} target="_blank" rel="noreferrer" className="hover:text-primary transition">
                {store.address}
              </a>
            </ContactCard>
            <ContactCard icon={Phone} title="Téléphone">
              <a href={`tel:${store.phone}`} className="hover:text-primary transition">
                {store.phone}
              </a>
            </ContactCard>
            <ContactCard icon={Mail} title="Email">
              <a href={`mailto:${store.email}`} className="hover:text-primary transition">
                {store.email}
              </a>
            </ContactCard>
            {whatsappDigits && (
              <ContactCard icon={MessageCircle} title="WhatsApp">
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition"
                >
                  Discuter sur WhatsApp
                </a>
              </ContactCard>
            )}
            <ContactCard icon={Clock} title="Horaires">
              {store.hours}
            </ContactCard>
          </div>

          {/* Formulaire */}
          <form
            action={sendContactMessage}
            className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-4 self-start"
          >
            {/* Anti-spam : timestamp + honeypot (voir lib/spam-check.ts) */}
            <input type="hidden" name="formRenderedAt" value={Date.now()} />
            <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden opacity-0 pointer-events-none">
              <label htmlFor="website-contact">Site web (ne pas remplir)</label>
              <input id="website-contact" type="text" name="website" tabIndex={-1} autoComplete="off" />
            </div>
          <h2 className="text-xl font-extrabold mb-2 tracking-tight">Envoyer un message</h2>
          {sent && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-400">Message envoyé !</div>
                <div className="text-sm text-foreground-muted">
                  Notre équipe vous répond sous 24h ouvrées.
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-primary">Erreur</div>
                <div className="text-sm text-foreground-muted">{error}</div>
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nom" name="name" required>
              <input name="name" type="text" required className={inputCls} />
            </Field>
            <Field label="Email" name="email" required>
              <input name="email" type="email" required className={inputCls} />
            </Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Téléphone" name="phone">
              <input name="phone" type="tel" className={inputCls} />
            </Field>
            <Field label="Sujet" name="subject" required>
              <select name="subject" required className={inputCls}>
                <option value="">— Sélectionnez —</option>
                <option>Question sur un produit</option>
                <option>Demande de devis réparation</option>
                <option>Suivi de commande</option>
                <option>Suivi de réparation</option>
                <option>Réclamation</option>
                <option>Autre</option>
              </select>
            </Field>
          </div>
          <Field label="Message" name="message" required>
            <textarea name="message" rows={6} required className={inputCls} />
          </Field>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-bold transition shadow-[0_0_24px_var(--primary-glow)]"
          >
            <Send className="h-4 w-4" />
            Envoyer le message
          </button>
          </form>
        </div>

        {/* Carte Google Maps — pleine largeur sous le formulaire (= largeur du
            contenu de la page, ce qui inclut les infos à gauche + form à droite) */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="aspect-[21/9] w-full relative">
            <iframe
              src={embedUrl}
              title="Carte du magasin"
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <a
            href={store.gmaps}
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-3 text-sm text-foreground-muted hover:text-primary transition border-t border-border text-center"
          >
            Itinéraire sur Google Maps →
          </a>
        </div>
      </div>
    </>
  );
}

const inputCls = "w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

function Field({ label, name, required, children }: { label: string; name: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex gap-4 hover:border-primary transition">
      <div className="h-10 w-10 grid place-items-center bg-primary/10 border border-primary/20 text-primary rounded-lg shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-semibold mb-0.5">{title}</div>
        <div className="text-sm text-foreground-muted">{children}</div>
      </div>
    </div>
  );
}
