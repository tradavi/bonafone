"use client";

import { useRouter } from "next/navigation";

type BrandOption = {
  id: string;
  name: string;
  modelCount: number;
};

/**
 * Combobox de selection d'une marque sur /admin/marques.
 * Navigation cote client via router.push pour ne pas recharger toute la page,
 * met juste a jour le searchParam ?brand=<id>.
 */
export function BrandSelector({
  brands,
  current,
}: {
  brands: BrandOption[];
  current: string | null;
}) {
  const router = useRouter();

  return (
    <select
      value={current ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) router.push("/admin/marques");
        else router.push(`/admin/marques?brand=${encodeURIComponent(v)}`);
      }}
      className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
    >
      <option value="">— Choisir une marque —</option>
      {brands.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name} ({b.modelCount} modèle{b.modelCount > 1 ? "s" : ""})
        </option>
      ))}
    </select>
  );
}
