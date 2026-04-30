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
  ShieldCheck,
  RotateCcw,
  Cog,
  BadgeCheck,
  Music2,
  Linkedin,
  Twitter,
} from "lucide-react";
import { getStoreSettings } from "@/lib/store-settings";
import { LogoFull } from "@/components/ui/logo";

export async function Footer() {
  const store = await getStoreSettings();
  const whatsappDigits = store.whatsapp.replace(/\D/g, "");
  // Réseaux sociaux : on affiche tous ceux configurés en admin. WhatsApp a son
  // propre format wa.me/<digits>.
  const socials: { icon: typeof Facebook; href: string; label: string }[] = [
    store.facebook && { icon: Facebook, href: store.facebook, label: "Facebook" },
    store.instagram && { icon: Instagram, href: store.instagram, label: "Instagram" },
    whatsappDigits && {
      icon: MessageCircle,
      href: `https://wa.me/${whatsappDigits}`,
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
            { icon: Cog, title: "Pièces de rechange de qualité", text: "Composants d'origine ou compatibles testés" },
            { icon: ShieldCheck, title: "Garantie incluse", text: "Jusqu'à 12 mois selon réparation" },
            { icon: RotateCcw, title: "Retour simple", text: "En cas de problème, on reprend le dossier" },
            { icon: BadgeCheck, title: "Techniciens confirmés", text: "Expérience prouvée toutes marques" },
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

      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-3">
        {/* Magasin */}
        <div>
          <LogoFull className="mb-5" />
          <p className="text-sm text-foreground-muted mb-4">
            Service de réparation et reconditionné — smartphones, tablettes et ordinateurs.
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

        <FooterCol title="Service réparation" links={[
          ["/reparations", "Demande de devis"],
          ["/reparations/suivi", "Suivre ma réparation"],
          ["/temoignages", "Avis clients"],
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

      {/* Réseaux sociaux */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {socials.length > 0 ? (
              <>
                <span className="text-sm text-foreground-muted">Suivez-nous</span>
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
              </>
            ) : (
              <span className="text-xs text-foreground-subtle">
                Réseaux sociaux à configurer dans /admin/parametres
              </span>
            )}
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
