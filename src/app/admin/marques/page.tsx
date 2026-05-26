import { Plus, Trash2, Save, Smartphone, Tablet, Laptop, Layers, CheckCircle2, AlertCircle, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  createBrand,
  deleteBrand,
  createDeviceModel,
  deleteDeviceModel,
  updateDeviceModel,
} from "@/lib/actions/brands";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { BrandSelector } from "@/components/admin/brand-selector";

export const metadata = { title: "Marques & modèles" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ saved?: string; error?: string; brand?: string }>;
};

const DEVICE_TYPES = [
  { code: "SMARTPHONE", label: "Smartphone", icon: Smartphone },
  { code: "TABLETTE", label: "Tablette", icon: Tablet },
  { code: "ORDINATEUR_PORTABLE", label: "PC portable", icon: Laptop },
  { code: "AUTRE", label: "Autre", icon: Layers },
];

export default async function AdminMarquesPage({ searchParams }: Props) {
  const { saved, error, brand: brandIdParam } = await searchParams;

  // 1) Liste legere des marques (pour le combobox) avec count
  const allBrands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { deviceModels: true } },
    },
  });

  // 2) Marque selectionnee : on charge tous ses modeles + count produits
  const selectedBrand = brandIdParam
    ? await prisma.brand.findUnique({
        where: { id: brandIdParam },
        include: {
          deviceModels: { orderBy: [{ deviceType: "asc" }, { name: "asc" }] },
          _count: { select: { products: true } },
        },
      })
    : null;

  // Tri naturel DESCENDANT des modeles : "IPhone 16 Pro Max" en tete,
  // "IPhone 7" en bas. Coherent avec le formulaire de creation reparation.
  const collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });
  const modelsByType: Record<string, typeof selectedBrand extends null ? never : NonNullable<typeof selectedBrand>["deviceModels"]> = {};
  if (selectedBrand) {
    for (const m of selectedBrand.deviceModels) {
      (modelsByType[m.deviceType] ??= []).push(m);
    }
    for (const list of Object.values(modelsByType)) {
      // Inversion (b, a) : plus recents en haut
      list.sort((a, b) => collator.compare(b.name, a.name));
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Marques & modèles</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Choisissez une marque pour voir et gérer ses modèles. Le formulaire
          de réparation lit cette liste pour proposer des suggestions de modèles.
        </p>
      </div>

      {/* Flash messages */}
      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>Modifications enregistrées.</div>
        </div>
      )}
      {error && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-start gap-2 text-sm">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Combobox + ajout marque cote a cote */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Sélectionner une marque
          </h2>
          <BrandSelector
            brands={allBrands.map((b) => ({
              id: b.id,
              name: b.name,
              modelCount: b._count.deviceModels,
            }))}
            current={brandIdParam ?? null}
          />
          <p className="text-[11px] text-foreground-muted mt-2">
            {allBrands.length} marque{allBrands.length > 1 ? "s" : ""} disponible
            {allBrands.length > 1 ? "s" : ""} ·{" "}
            {allBrands.reduce((s, b) => s + b._count.deviceModels, 0)} modèles au total
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Ajouter une marque
          </h2>
          <form action={createBrand} className="flex flex-wrap items-end gap-2">
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              placeholder="Ex : OnePlus, Sony, Crosscall…"
              className={`${inputCls} flex-1 min-w-[160px]`}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition"
            >
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          </form>
          <p className="text-[11px] text-foreground-muted mt-2">
            Le nom doit commencer par une majuscule. Évitez les doublons.
          </p>
        </div>
      </div>

      {/* Panneau marque selectionnee */}
      {!selectedBrand && (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center text-foreground-muted">
          <Tag className="h-10 w-10 mx-auto mb-3 text-foreground-subtle" />
          <div className="font-medium">Aucune marque sélectionnée</div>
          <div className="text-sm mt-1">
            Choisissez une marque ci-dessus pour voir ses modèles.
          </div>
        </div>
      )}

      {selectedBrand && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          {/* En-tete marque */}
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4 pb-4 border-b border-border">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">{selectedBrand.name}</h2>
              <p className="text-xs text-foreground-muted mt-0.5">
                {selectedBrand.deviceModels.length} modèle
                {selectedBrand.deviceModels.length > 1 ? "s" : ""}
                {selectedBrand._count.products > 0 && (
                  <span> · {selectedBrand._count.products} produit(s) au catalogue</span>
                )}
              </p>
            </div>
            <form action={deleteBrand}>
              <input type="hidden" name="id" value={selectedBrand.id} />
              <ConfirmSubmitButton
                message={`Supprimer la marque "${selectedBrand.name}" et TOUS ses ${selectedBrand.deviceModels.length} modèle(s) ?`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 hover:bg-primary hover:text-white text-primary rounded-lg text-sm font-semibold transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer la marque
              </ConfirmSubmitButton>
            </form>
          </div>

          {/* Modeles groupes par type */}
          <div className="space-y-5">
            {DEVICE_TYPES.map((dt) => {
              const models = modelsByType[dt.code] ?? [];
              return (
                <div key={dt.code}>
                  <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider font-bold text-foreground-muted">
                    <dt.icon className="h-3.5 w-3.5 text-primary" />
                    {dt.label} ({models.length})
                  </div>
                  {models.length > 0 ? (
                    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5 mb-2">
                      {models.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
                        >
                          <form action={updateDeviceModel} className="flex-1 flex gap-1 items-center min-w-0">
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="brandId" value={selectedBrand.id} />
                            <input type="hidden" name="deviceType" value={m.deviceType} />
                            <input
                              name="name"
                              defaultValue={m.name}
                              className="flex-1 bg-transparent border-0 outline-none focus:bg-surface focus:ring-1 focus:ring-primary/40 rounded px-1 py-0.5 text-sm min-w-0"
                            />
                            <button
                              type="submit"
                              title="Enregistrer"
                              className="h-6 w-6 grid place-items-center rounded hover:bg-primary/10 hover:text-primary text-foreground-muted transition shrink-0"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          </form>
                          <form action={deleteDeviceModel}>
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="brandId" value={selectedBrand.id} />
                            <button
                              type="submit"
                              title="Supprimer"
                              className="h-6 w-6 grid place-items-center rounded hover:bg-primary/10 hover:text-primary text-foreground-muted transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-foreground-subtle italic mb-2">
                      Aucun modèle.
                    </p>
                  )}
                  {/* Ajouter un modele de ce type */}
                  <form
                    action={createDeviceModel}
                    className="flex gap-1.5 items-center"
                  >
                    <input type="hidden" name="brandId" value={selectedBrand.id} />
                    <input type="hidden" name="deviceType" value={dt.code} />
                    <input
                      name="name"
                      required
                      minLength={1}
                      maxLength={80}
                      placeholder={`Ajouter un modèle ${dt.label.toLowerCase()}…`}
                      className={`${inputCls} text-sm py-1.5`}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-surface-2 border border-border hover:border-primary hover:text-primary text-foreground-muted rounded-lg text-xs font-semibold transition shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" /> Ajouter
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";
