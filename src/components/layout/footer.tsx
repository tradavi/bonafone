import Link from "next/link";
import {
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  CreditCard,
  Truck,
  ShieldCheck,
  RotateCcw,
  Music2,
  Linkedin,
  Twitter,
} from "lucide-react";
import { getStoreSettings } from "@/lib/store-settings";
import { LogoFull } from "@/components/ui/logo";

export async function Footer() {
  const store = await getStoreSettings();
  const socials: { icon: typeof Facebook; href: string; label: string }[] = [
    store.facebook && { icon: Facebook, href: store.facebook, label: "Facebook" },
    store.instagram && { icon: Instagram, href: store.instagram, label: "Instagram" },
    store.whatsapp && {
      icon: MessageCircle,
      href: `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`,
      label: "WhatsApp",
    },
    store.youtube && { icon: Youtube, href: store.youtube, label: "YouTube" },
    store.tiktok && { icon: Music2, href: store.tiktok, label: "TikTok" },
    store.linkedin && { icon: Linkedin, href: store.linkedin, label: "LinkedIn" },
    store.twitter && { icon: Twitter, href: store.twitter, label: "X / Twitter" },
  ].filter(Boolean) as { icon: typeof Facebook; href: string; label: string }[];
  return (
    <footer className="bg-black text-foreground/80 mt-auto border-t border-border">
      {/* Bandeau confiance */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: "Livraison rapide", text: "Colissimo, Chronopost, Mondial Relay" },
            { icon: ShieldCheck, title: "Garantie incluse", text: "12 à 24 mois selon produit" },
            { icon: RotateCcw, title: "Retours simples", text: "14 jours pour changer d'avis" },
            { icon: CreditCard, title: "Paiement 4x", text: "CB, PayPal, Alma, Klarna" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">{title}</div>
                <div className="text-xs text-foreground-muted">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-4">
        {/* Magasin */}
        <div>
          <LogoFull className="mb-5" />
          <p className="text-sm text-foreground-muted mb-4">
            Vente, reconditionné et réparation de smartphones, tablettes et ordinateurs.
          </p>
          <ul className="space-y-2 text-sm text-foreground-muted">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <a href={store.gmaps} target="_blank" rel="noreferrer" className="hover:text-foreground transition">
                {store.address}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <a href={`tel:${store.phone}`} className="hover:text-foreground transition">
                {store.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <a href={`mailto:${store.email}`} className="hover:text-foreground transition">
                {store.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              {store.hours}
            </li>
          </ul>
        </div>

        <FooterCol title="Boutique" links={[
          ["/boutique/smartphones", "Smartphones"],
          ["/boutique/tablettes", "Tablettes"],
          ["/boutique/ordinateurs", "Ordinateurs"],
          ["/boutique/accessoires", "Accessoires"],
          ["/boutique", "Toutes les promotions"],
        ]} />

        <FooterCol title="Services" links={[
          ["/reparations", "Demande de devis"],
          ["/reparations/suivi", "Suivi de réparation"],
          ["/reprise", "Reprise d'ancien appareil"],
          ["/temoignages", "Avis clients"],
          ["/blog", "Blog & Conseils"],
        ]} />

        <FooterCol title="Aide & Compte" links={[
          ["/compte", "Mon compte"],
          ["/contact", "Contact"],
          ["/reclamations", "Réclamations"],
          ["/conditions", "CGV"],
          ["/confidentialite", "Confidentialité"],
          ["/mentions-legales", "Mentions légales"],
        ]} />
      </div>

      {/* Réseaux & paiement */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {socials.length > 0 && (
              <span className="text-sm text-foreground-muted">Suivez-nous</span>
            )}
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="h-9 w-9 grid place-items-center rounded-full bg-surface border border-border hover:bg-primary hover:border-primary transition"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <span>Paiement sécurisé</span>
            {["CB", "Visa", "PayPal", "Alma"].map((p) => (
              <span key={p} className="px-2 py-1 bg-surface border border-border rounded">{p}</span>
            ))}
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-foreground-subtle">
          © {new Date().getFullYear()} {store.name}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="font-semibold mb-4 text-foreground">{title}</div>
      <ul className="space-y-2 text-sm text-foreground-muted">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="hover:text-foreground transition">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
