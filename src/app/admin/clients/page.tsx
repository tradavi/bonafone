import Link from "next/link";
import { Search, ArrowRight, Mail, Phone, Users } from "lucide-react";
import { getAdminAllClients } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { displayEmail } from "@/lib/synthetic-email";

export const metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

const ROLE_STYLES: Record<string, string> = {
  CLIENT: "bg-primary/10 text-primary border-primary/30",
  TECHNICIEN: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};
const ROLE_LABEL: Record<string, string> = {
  CLIENT: "Client",
  TECHNICIEN: "Technicien",
};

type Props = { searchParams: Promise<{ q?: string; role?: string }> };

export default async function AdminClientsPage({ searchParams }: Props) {
  const { q = "", role = "" } = await searchParams;

  const all = await getAdminAllClients();
  const filtered = all
    .filter((u) => (role ? u.role === role : true))
    .filter((u) => {
      if (!q) return true;
      const needle = q.toLowerCase();
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim().toLowerCase();
      return (
        fullName.includes(needle) ||
        (u.email ?? "").toLowerCase().includes(needle) ||
        (u.phone ?? "").toLowerCase().includes(needle)
      );
    });

  const totalRevenue = all.reduce((sum, u) => sum + u.totalSpent, 0);

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 grid place-items-center bg-primary/10 border border-primary/20 text-primary rounded-xl shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Clients</h1>
            <p className="text-sm text-foreground-muted">
              {all.length} fiche{all.length > 1 ? "s" : ""} · {formatPrice(totalRevenue)} cumulés
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <form className="flex-1 min-w-[240px] relative">
            {role && <input type="hidden" name="role" value={role} />}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher par nom, email, téléphone…"
              className="w-full pl-9 pr-3.5 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle"
            />
          </form>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              ["", "Tous"],
              ["CLIENT", "Clients"],
              ["TECHNICIEN", "Techniciens"],
            ].map(([code, label]) => {
              const params = new URLSearchParams();
              if (code) params.set("role", code);
              if (q) params.set("q", q);
              const href = `/admin/clients${params.toString() ? `?${params}` : ""}`;
              const active = role === code;
              return (
                <Link
                  key={code}
                  href={href}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-2 border-border text-foreground-muted hover:border-primary"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr className="text-left text-xs uppercase tracking-wider text-foreground-muted">
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Rôle</th>
                <th className="px-4 py-3 font-semibold text-right">Commandes</th>
                <th className="px-4 py-3 font-semibold text-right">Réparations</th>
                <th className="px-4 py-3 font-semibold text-right">CA cumulé</th>
                <th className="px-4 py-3 font-semibold">Inscrit</th>
                <th className="px-4 py-3 font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-foreground-muted">
                    Aucun client.
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const fullName =
                  `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Sans nom";
                const initials =
                  (u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? u.email?.[0] ?? "?");
                return (
                  <tr key={u.id} className="border-t border-border hover:bg-surface-2 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 grid place-items-center rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase shrink-0">
                          {initials.slice(0, 2)}
                        </div>
                        <div>
                          <Link
                            href={`/admin/clients/${u.id}`}
                            className="font-medium hover:text-primary transition"
                          >
                            {fullName}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {displayEmail(u.email) ? (
                        <div className="flex items-center gap-1.5 text-foreground-muted">
                          <Mail className="h-3 w-3" />
                          {displayEmail(u.email)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-foreground-subtle italic">
                          <Mail className="h-3 w-3" />
                          Pas d&apos;email
                        </div>
                      )}
                      {u.phone && (
                        <div className="flex items-center gap-1.5 text-foreground-muted mt-0.5">
                          <Phone className="h-3 w-3" />
                          {u.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          ROLE_STYLES[u.role] ?? ROLE_STYLES.CLIENT
                        }`}
                      >
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {u._count.orders}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {u._count.repairs}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatPrice(u.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted text-xs">
                      {u.createdAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Brussels" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/clients/${u.id}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition"
                        aria-label="Détail"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
