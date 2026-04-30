import {
  LayoutDashboard,
  Wrench,
  FileText,
  Users,
  MessageSquare,
  Star,
  Settings,
  AlertCircle,
} from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { countDevisRequests } from "@/lib/queries";

const ICON_CLS = "h-4 w-4";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { default: "Back-office", template: "%s | Admin Bonafone" },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const devisCount = await countDevisRequests().catch(() => 0);

  const NAV = [
    { href: "/admin", label: "Tableau de bord", icon: <LayoutDashboard className={ICON_CLS} /> },
    { href: "/admin/reparations", label: "Réparations", icon: <Wrench className={ICON_CLS} /> },
    {
      href: "/admin/devis",
      label: "Demandes de devis",
      icon: <FileText className={ICON_CLS} />,
      badge: devisCount > 0 ? devisCount : undefined,
    },
    { href: "/admin/clients", label: "Clients", icon: <Users className={ICON_CLS} /> },
    { href: "/admin/avis", label: "Avis", icon: <Star className={ICON_CLS} /> },
    { href: "/admin/reclamations", label: "Réclamations", icon: <AlertCircle className={ICON_CLS} /> },
    { href: "/admin/messages", label: "Messages", icon: <MessageSquare className={ICON_CLS} /> },
    { href: "/admin/parametres", label: "Paramètres", icon: <Settings className={ICON_CLS} /> },
  ];

  return (
    <div className="bg-background min-h-[80vh] print:bg-white print:min-h-0">
      <div className="mx-auto max-w-[1400px] px-4 py-6 grid lg:grid-cols-[240px_1fr] gap-6 print:grid-cols-1 print:max-w-none print:p-0 print:gap-0">
        <aside className="bg-surface border border-border rounded-2xl p-3 self-start print:hidden">
          <div className="px-3 py-3 mb-2 border-b border-border flex items-center gap-2.5">
            <LogoMark className="h-7 w-auto" />
            <div className="leading-tight flex-1">
              <div className="font-bold text-sm">Back-office</div>
              <div className="text-[10px] text-foreground-muted uppercase tracking-wider">Admin</div>
            </div>
            <ThemeToggle compact />
          </div>
          <SidebarNav items={NAV} />
        </aside>
        <div className="print:p-0">{children}</div>
      </div>
    </div>
  );
}
