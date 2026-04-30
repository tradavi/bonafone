import { Save } from "lucide-react";
import { getBrandNames } from "@/lib/queries";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  grade: string | null;
  brand: { name: string };
  price: number;
  originalPrice: number | null;
  stock: number;
  lowStockAt: number;
  warrantyMonths: number;
  barcode: string | null;
  badge: string | null;
  primaryImage: string | null;
  isFeatured: boolean;
  isActive: boolean;
};

const CATEGORIES = [
  { value: "SMARTPHONE", label: "Smartphone" },
  { value: "TABLETTE", label: "Tablette" },
  { value: "ACCESSOIRE", label: "Accessoire" },
  { value: "ORDINATEUR_PORTABLE", label: "Ordinateur portable" },
];

const CONDITIONS = [
  { value: "RECONDITIONNE", label: "Reconditionné" },
  { value: "OCCASION", label: "Occasion" },
];

export async function ProductForm({
  product,
  action,
  submitLabel = "Enregistrer",
}: {
  product?: Product;
  action: (formData: FormData) => Promise<void>;
  submitLabel?: string;
}) {
  const brands = await getBrandNames();

  return (
    <form action={action} encType="multipart/form-data" className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Section title="Identité">
        <Grid>
          <Field label="Nom du produit" name="name" required defaultValue={product?.name} className="md:col-span-2" />
          <Field
            label="Slug (URL)"
            name="slug"
            placeholder={product ? undefined : "(auto-généré si vide)"}
            defaultValue={product?.slug}
          />
          <Select label="Marque" name="brandName" required defaultValue={product?.brand.name}>
            <option value="">— Choisir —</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
            {/* permet aussi de saisir une marque libre via datalist plus bas */}
          </Select>
          <Select label="Catégorie" name="category" required defaultValue={product?.category}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Select label="État" name="condition" defaultValue={product?.condition}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Field label="Grade (A/B/C, occasions)" name="grade" defaultValue={product?.grade ?? ""} />
          <Field
            label="Badge (Promo, Nouveau…)"
            name="badge"
            defaultValue={product?.badge ?? ""}
          />
        </Grid>
        <Textarea
          label="Description"
          name="description"
          rows={4}
          defaultValue={product?.description}
        />
      </Section>

      <Section title="Prix & stock">
        <Grid>
          <Field
            label="Prix (€)"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.price.toString()}
          />
          <Field
            label="Prix barré (€)"
            name="originalPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.originalPrice?.toString() ?? ""}
          />
          <Field
            label="Stock"
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={product?.stock.toString() ?? "0"}
          />
          <Field
            label="Seuil alerte stock"
            name="lowStockAt"
            type="number"
            min="0"
            defaultValue={product?.lowStockAt.toString() ?? "3"}
          />
          <Field
            label="Garantie (mois)"
            name="warrantyMonths"
            type="number"
            min="0"
            defaultValue={product?.warrantyMonths.toString() ?? "24"}
          />
          <Field
            label="Code-barres (EAN13 / UPC)"
            name="barcode"
            defaultValue={product?.barcode ?? ""}
            placeholder="Scanner ou saisir le code"
          />
        </Grid>
      </Section>

      <Section title="Image principale">
        {product?.primaryImage && (
          <div className="mb-4 flex items-center gap-4">
            <img
              src={product.primaryImage}
              alt="aperçu"
              className="h-24 w-24 object-cover rounded-lg border border-border bg-surface-2"
            />
            <div className="text-xs text-foreground-muted">
              Image actuelle. Téléchargez-en une autre ci-dessous pour la remplacer.
            </div>
          </div>
        )}
        <label className="block">
          <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
            Téléverser une image (jpg, png, webp · max 8 Mo)
          </span>
          <input
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="block w-full text-sm text-foreground-muted file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-primary file:text-white file:font-semibold file:cursor-pointer hover:file:bg-primary-strong"
          />
        </label>
        <div className="mt-4">
          <Field
            label="… ou URL d'une image existante (https:// ou data:)"
            name="primaryImage"
            defaultValue={product?.primaryImage ?? ""}
            className="md:col-span-2"
          />
          <p className="text-[11px] text-foreground-muted mt-1">
            Si vous téléversez un fichier, il remplacera l&apos;URL ci-dessus.
          </p>
        </div>
      </Section>

      <Section title="Visibilité">
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
              className="accent-primary"
            />
            Actif (visible dans le catalogue)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product?.isFeatured ?? false}
              className="accent-primary"
            />
            Mis en avant (page d&apos;accueil)
          </label>
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
        >
          <Save className="h-4 w-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h2 className="font-extrabold tracking-tight mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  step,
  min,
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  step?: string;
  min?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        step={step}
        min={min}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );
}

function Select({
  label,
  name,
  required,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      <select name={name} required={required} defaultValue={defaultValue} className={inputCls}>
        {children}
      </select>
    </label>
  );
}

function Textarea({
  label,
  name,
  rows = 3,
  defaultValue,
}: {
  label: string;
  name: string;
  rows?: number;
  defaultValue?: string;
}) {
  return (
    <label className="block mt-3">
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">{label}</span>
      <textarea name={name} rows={rows} defaultValue={defaultValue} className={inputCls} />
    </label>
  );
}
