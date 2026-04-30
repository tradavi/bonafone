import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { BarcodeScanBanner } from "@/components/admin/barcode-scan-banner";
import { createProduct } from "@/lib/actions/admin";

export const metadata = { title: "Nouveau produit" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewProductPage({ searchParams }: Props) {
  const { error } = await searchParams;
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
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Nouveau produit</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Scannez un code-barres pour vérifier si le produit existe, ou remplissez le formulaire pour en créer un.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-foreground-muted">{error}</div>
        </div>
      )}

      <BarcodeScanBanner />

      <ProductForm action={createProduct} submitLabel="Créer le produit" />
    </div>
  );
}
