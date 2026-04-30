import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle2, Trash2, Plus, Minus } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct, archiveProduct, adjustProductStock } from "@/lib/actions/admin";
import { getAdminProductById } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Modifier produit" };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, saved } = await searchParams;

  const product = await getAdminProductById(id);
  if (!product) notFound();

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <Link
          href="/admin/produits"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {product.name}
            </h1>
            <div className="text-sm text-foreground-muted mt-1">
              {product.brand.name} ·{" "}
              <Link
                href={`/produit/${product.slug}`}
                target="_blank"
                className="text-primary hover:underline"
              >
                Voir sur le site →
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 text-sm font-bold rounded-lg border border-border bg-surface-2">
              {formatPrice(product.price)}
            </div>
            <div
              className={`px-3 py-1.5 text-sm font-bold rounded-lg border ${
                product.stock <= product.lowStockAt
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {product.stock} en stock
            </div>
          </div>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-foreground-muted">Produit enregistré.</div>
        </div>
      )}
      {error && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-foreground-muted">{error}</div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="font-extrabold tracking-tight mb-3">Ajustement rapide du stock</h2>
        <div className="flex items-center gap-2">
          {[-10, -1, +1, +10].map((delta) => (
            <form key={delta} action={adjustProductStock}>
              <input type="hidden" name="id" value={product.id} />
              <input type="hidden" name="delta" value={delta} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-2 bg-surface-2 border border-border hover:border-primary rounded-lg text-sm font-semibold transition"
              >
                {delta > 0 ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                {Math.abs(delta)}
              </button>
            </form>
          ))}
        </div>
      </div>

      <ProductForm product={product} action={updateProduct} submitLabel="Enregistrer" />

      <div className="bg-surface border border-primary/30 rounded-2xl p-5">
        <h2 className="font-extrabold tracking-tight mb-1 text-primary">Zone dangereuse</h2>
        <p className="text-sm text-foreground-muted mb-3">
          Archiver le produit le retire du catalogue mais conserve l&apos;historique commandes/stocks.
        </p>
        <form action={archiveProduct}>
          <input type="hidden" name="id" value={product.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/40 rounded-lg text-sm font-semibold transition"
          >
            <Trash2 className="h-4 w-4" />
            Archiver le produit
          </button>
        </form>
      </div>
    </div>
  );
}
