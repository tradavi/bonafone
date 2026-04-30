import { Plus, Edit3, Search } from "lucide-react";
import Link from "next/link";
import { getAdminAllProducts } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Produits" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; archived?: string }> };

export default async function AdminProduitsPage({ searchParams }: Props) {
  const { q = "", archived } = await searchParams;
  const all = await getAdminAllProducts();
  const showArchived = archived === "1";
  const filtered = all
    .filter((p) => (showArchived ? !p.isActive : p.isActive))
    .filter((p) =>
      q
        ? `${p.name} ${p.brand.name} ${p.slug} ${p.barcode ?? ""}`
            .toLowerCase()
            .includes(q.toLowerCase())
        : true,
    );

  const activeCount = all.filter((p) => p.isActive).length;
  const archivedCount = all.length - activeCount;

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Produits</h1>
          <p className="text-sm text-foreground-muted">
            {activeCount} actif{activeCount > 1 ? "s" : ""} · {archivedCount} archivé
            {archivedCount > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/produits/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
        >
          <Plus className="h-4 w-4" />
          Nouveau produit
        </Link>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <form className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher par nom, marque, slug, code-barres…"
              className="w-full pl-9 pr-3.5 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle"
            />
            {showArchived && <input type="hidden" name="archived" value="1" />}
          </form>
          <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
            <Link
              href={`/admin/produits${q ? `?q=${encodeURIComponent(q)}` : ""}`}
              className={`px-3 py-2 ${
                !showArchived ? "bg-primary text-white" : "bg-surface-2 hover:bg-surface text-foreground-muted"
              }`}
            >
              Actifs
            </Link>
            <Link
              href={`/admin/produits?archived=1${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`px-3 py-2 ${
                showArchived ? "bg-primary text-white" : "bg-surface-2 hover:bg-surface text-foreground-muted"
              }`}
            >
              Archivés
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr className="text-left text-xs uppercase tracking-wider text-foreground-muted">
                <th className="px-4 py-3 font-semibold">Produit</th>
                <th className="px-4 py-3 font-semibold">Catégorie</th>
                <th className="px-4 py-3 font-semibold">État</th>
                <th className="px-4 py-3 font-semibold">Prix</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-foreground-muted">
                    Aucun produit trouvé.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-surface-2 transition group">
                  <td className="px-4 py-3">
                    <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-3">
                      {p.primaryImage ? (
                        <img
                          src={p.primaryImage}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-surface border border-border" />
                      )}
                      <div>
                        <div className="font-medium group-hover:text-primary transition">{p.name}</div>
                        <div className="text-xs text-foreground-muted">
                          {p.brand.name} · /{p.slug}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-foreground-muted">
                    {p.category.toLowerCase().replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 capitalize text-xs text-foreground-muted">
                    {p.condition.toLowerCase()}
                    {p.grade && ` · ${p.grade}`}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold ${
                        p.stock <= p.lowStockAt ? "text-primary" : "text-emerald-400"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/produits/${p.id}`}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition"
                      aria-label="Modifier"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
