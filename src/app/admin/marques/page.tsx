import { Plus, Trash2, Save, Smartphone, Tablet, Laptop, Layers, CheckCircle2, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  createBrand,
  deleteBrand,
  createDeviceModel,
  deleteDeviceModel,
  updateDeviceModel,
} from "@/lib/actions/brands";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export const metadata = { title: "Marques & modèles" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

const DEVICE_TYPES = [
  { code: "SMARTPHONE", label: "Smartphone", icon: Smartphone },
  { code: "TABLETTE", label: "Tablette", icon: Tablet },
  { code: "ORDINATEUR_PORTABLE", label: "PC portable", icon: Laptop },
  { code: "AUTRE", label: "Autre", icon: Layers },
];

export default async function AdminMarquesPage({ searchParams }: Props) {
  const { saved, error } = await searchParams;

  // Charge toutes les marques avec leurs modeles tries
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: {
      deviceModels: { orderBy: [{ deviceType: "asc" }, { name: "asc" }] },
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Marques & modèles</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Gérez les marques et modèles d&apos;appareils proposés dans le formulaire de
          réparation. Les modèles sont rangés par type (smartphone/tablette/PC portable).
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

      {/* Ajouter une marque */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="font-extrabold mb-3 flex items-center gap-2 tracking-tight">
          <Plus className="h-4 w-4 text-primary" />
          Ajouter une marque
        </h2>
        <form action={createBrand} className="flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[200px]">
            <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
              Nom (commence par majuscule)
            </span>
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              placeholder="Ex : OnePlus, Sony, Crosscall…"
              className={inputCls}
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition"
          >
            <Plus className="h-4 w-4" /> Ajouter la marque
          </button>
        </form>
      </div>

      {/* Liste des marques avec leurs modeles */}
      <div className="space-y-4">
        {brands.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-foreground-muted">
            Aucune marque enregistrée — ajoutez-en une ci-dessus.
          </div>
        )}
        {brands.map((b) => {
          // Regroupe les modeles par deviceType + tri naturel par groupe
          // ("IPhone 8" avant "IPhone 16" — pas le tri alphabetique brut)
          const collator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });
          const byType: Record<string, typeof b.deviceModels> = {};
          for (const m of b.deviceModels) {
            (byType[m.deviceType] ??= []).push(m);
          }
          for (const list of Object.values(byType)) {
            list.sort((a, b) => collator.compare(a.name, b.name));
          }
          return (
            <div
              key={b.id}
              id={`brand-${b.id}`}
              className="bg-surface border border-border rounded-2xl p-5 scroll-mt-20"
            >
              {/* En-tete marque */}
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">{b.name}</h2>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {b.deviceModels.length} modèle{b.deviceModels.length > 1 ? "s" : ""}
                    {b._count.products > 0 && (
                      <span> · {b._count.products} produit(s) au catalogue</span>
                    )}
                  </p>
                </div>
                <form action={deleteBrand}>
                  <input type="hidden" name="id" value={b.id} />
                  <ConfirmSubmitButton
                    message={`Supprimer la marque "${b.name}" et TOUS ses ${b.deviceModels.length} modèle(s) ?`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/30 hover:bg-primary hover:text-white text-primary rounded-lg text-xs font-semibold transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </ConfirmSubmitButton>
                </form>
              </div>

              {/* Modeles groupes par type */}
              <div className="space-y-4">
                {DEVICE_TYPES.map((dt) => {
                  const models = byType[dt.code] ?? [];
                  return (
                    <div key={dt.code}>
                      <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider font-bold text-foreground-muted">
                        <dt.icon className="h-3.5 w-3.5 text-primary" />
                        {dt.label} ({models.length})
                      </div>
                      {models.length > 0 ? (
                        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                          {models.map((m) => (
                            <li
                              key={m.id}
                              className="flex items-center gap-1 bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm"
                            >
                              <form action={updateDeviceModel} className="flex-1 flex gap-1 items-center">
                                <input type="hidden" name="id" value={m.id} />
                                <input type="hidden" name="brandId" value={b.id} />
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
                                <input type="hidden" name="brandId" value={b.id} />
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
                        className="flex gap-1.5 mt-1.5 items-center"
                      >
                        <input type="hidden" name="brandId" value={b.id} />
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
          );
        })}
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";
