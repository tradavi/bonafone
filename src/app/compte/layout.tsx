import {
  User,
  ShoppingBag,
  Wrench,
  Heart,
  MapPin,
  LogOut,
  UserCog,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@/auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { signOutAction } from "@/lib/actions/auth";

const ICON_CLS = "h-4 w-4";

const CLIENT_NAV = [
  { href: "/compte", label: "Tableau de bord", icon: <User className={ICON_CLS} /> },
  { href: "/compte/commandes", label: "Mes commandes", icon: <ShoppingBag className={ICON_CLS} /> },
  { href: "/compte/reparations", label: "Mes réparations", icon: <Wrench className={ICON_CLS} /> },
  { href: "/compte/wishlist", label: "Mes favoris", icon: <Heart className={ICON_CLS} /> },
  { href: "/compte/adresses", label: "Mes adresses", icon: <MapPin className={ICON_CLS} /> },
  { href: "/compte/profil", label: "Mon profil", icon: <UserCog className={ICON_CLS} /> },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Back-office", icon: <ShieldCheck className={ICON_CLS} /> },
  { href: "/compte/profil", label: "Mon profil", icon: <UserCog className={ICON_CLS} /> },
];

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const displayName =
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    "Vous";
  const NAV = session?.user?.role === "ADMIN" ? ADMIN_NAV : CLIENT_NAV;

  return (
    <div className="bg-background min-h-[60vh]">
      <div className="mx-auto max-w-7xl px-4 py-10 grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="bg-surface border border-border rounded-2xl p-3 self-start">
          <div className="px-3 py-3 mb-2 border-b border-border">
            <div className="font-bold tracking-tight">Mon compte</div>
            <div className="text-xs text-foreground-muted">Bienvenue {displayName} !</div>
          </div>
          <div className="space-y-0.5">
            <SidebarNav items={NAV} />
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground-muted hover:bg-primary/10 hover:text-primary transition border border-transparent"
              >
                <LogOut className={ICON_CLS} />
                Déconnexion
              </button>
            </form>
          </div>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
