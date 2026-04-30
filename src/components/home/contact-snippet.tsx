import Link from "next/link";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { STORE } from "@/lib/utils";

export function ContactSnippet() {
  return (
    <section className="py-16 md:py-20 bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
            Contact
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Venez nous rencontrer
          </h2>
          <p className="text-foreground-muted mb-8 leading-relaxed">
            Notre équipe vous accueille en boutique pour vous conseiller, diagnostiquer et réparer vos appareils.
          </p>

          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <a href={STORE.gmaps} target="_blank" rel="noreferrer" className="hover:text-primary transition">
                {STORE.address}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <a href={`tel:${STORE.phone}`} className="hover:text-primary transition">
                {STORE.phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <a href={`mailto:${STORE.email}`} className="hover:text-primary transition">
                {STORE.email}
              </a>
            </li>
          </ul>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
            >
              Nous contacter
            </Link>
            <a
              href={`https://wa.me/${STORE.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border hover:border-emerald-500 hover:text-emerald-400 rounded-lg font-semibold transition"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <Link
              href="/reclamations"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border hover:border-primary rounded-lg font-semibold transition"
            >
              Réclamation
            </Link>
          </div>
        </div>

        <div className="relative aspect-video rounded-2xl bg-surface border border-border overflow-hidden grid place-items-center">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 bg-primary/15 blur-3xl rounded-full" />
          <div className="text-center p-8 relative">
            <MapPin className="h-16 w-16 text-primary mx-auto mb-3" />
            <div className="font-semibold mb-1">Carte Google Maps</div>
            <div className="text-sm text-foreground-muted">Intégration via API à compléter</div>
          </div>
        </div>
      </div>
    </section>
  );
}
