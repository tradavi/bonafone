import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle, Clock, AlertCircle } from "lucide-react";
import { getStoreSettings, getStoreApiKeys } from "@/lib/store-settings";

export async function ContactSnippet() {
  const store = await getStoreSettings();
  const keys = await getStoreApiKeys();
  const whatsappDigits = store.whatsapp.replace(/\D/g, "");
  const mapsApiKey = keys.googleMapsApiKey;
  const embedUrl = mapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapsApiKey)}&q=${encodeURIComponent(store.address)}`
    : `https://www.google.com/maps?q=${encodeURIComponent(store.address)}&output=embed`;

  return (
    <section className="py-16 md:py-20 bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
            Contact & horaires
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Venez nous rencontrer
          </h2>
          <p className="text-foreground-muted mb-8 leading-relaxed">
            Notre équipe vous accueille en boutique pour vous conseiller, diagnostiquer et réparer
            vos appareils.
          </p>

          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Horaires d&apos;ouverture</div>
                <div className="text-sm text-foreground-muted">{store.hours}</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <a
                href={store.gmaps}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition"
              >
                {store.address}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <a href={`tel:${store.phone}`} className="hover:text-primary transition">
                {store.phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <a href={`mailto:${store.email}`} className="hover:text-primary transition">
                {store.email}
              </a>
            </li>
          </ul>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
            >
              <Mail className="h-4 w-4" />
              Contactez-nous
            </Link>
            <Link
              href="/reclamations"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border hover:border-primary rounded-lg font-semibold transition"
            >
              <AlertCircle className="h-4 w-4" />
              Introduire une réclamation
            </Link>
            {whatsappDigits && (
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border hover:border-emerald-500 hover:text-emerald-400 rounded-lg font-semibold transition"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="relative aspect-video rounded-2xl bg-surface border border-border overflow-hidden">
          <iframe
            src={embedUrl}
            title="Carte du magasin"
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
