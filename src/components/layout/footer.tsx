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

  // Réseaux sociaux : on affiche TOUJOURS les 4 principaux (Facebook,
  // Instagram, WhatsApp, YouTube). URL admin si configurée, sinon homepage
  // générique du service. Les autres réseaux (TikTok/LinkedIn/X) ne s'affichent
  // que s'ils sont configurés.
  const socials: { icon: typeof Facebook; href: string; label: string }[] = [
    { icon: Facebook, href: store.facebook || "https://www.facebook.com", label: "Facebook" },
    { icon: Instagram, href: store.instagram || "https://www.instagram.com", label: "Instagram" },
    {
      icon: MessageCircle,
      href: whatsappDigits ? `https://wa.me/${whatsappDigits}` : "https://www.whatsapp.com",
      label: "WhatsApp",
    },
    { icon: Youtube, href: store.youtube || "https://www.youtube.com", label: "YouTube" },
    ...(store.tiktok ? [{ icon: Music2, href: store.tiktok, label: "TikTok" }] : []),
    ...(store.linkedin ? [{ icon: Linkedin, href: store.linkedin, label: "LinkedIn" }] : []),
    ...(store.twitter ? [{ icon: Twitter, href: store.twitter, label: "X / Twitter" }] : []),
  ];

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

      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Colonne 1 : Logo + description + réseaux sociaux toujours visibles */}
        <div>
          <LogoFull className="mb-5" />
          <p className="text-sm text-foreground-muted mb-5">
            Service de réparation et reconditionné — smartphones, tablettes et ordinateurs.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                title={label}
                className="h-9 w-9 grid place-items-center rounded-full bg-surface border border-border hover:bg-primary hover:border-primary transition"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Colonne 2 : Service réparation */}
        <FooterCol
          title="Service réparation"
          links={[
            ["/reparations", "Demande de devis"],
            ["/reparations/suivi", "Suivre ma réparation"],
            ["/temoignages", "Avis clients"],
          ]}
        />

        {/* Colonne 3 : Aide & Compte */}
        <FooterCol
          title="Aide & Compte"
          links={[
            ["/compte", "Mon compte"],
            ["/contact", "Contact"],
            ["/reclamations", "Réclamations"],
            ["/conditions", "CGV"],
            ["/confidentialite", "Confidentialité"],
            ["/mentions-legales", "Mentions légales"],
          ]}
        />

        {/* Colonne 4 : Nous trouver — adresse, tél, email, horaires */}
        <div>
          <div className="font-semibold mb-4 text-foreground">Nous trouver</div>
          <ul className="space-y-2 text-sm text-foreground-muted">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <a
                href={store.gmaps}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition"
              >
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
      </div>

      {/* Copyright */}
      <div className="border-t border-border py-4 text-center text-xs text-foreground-subtle">
        © {new Date().getFullYear()} {store.name}. Tous droits réservés.
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
            <Link href={href} className="hover:text-foreground transition">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
