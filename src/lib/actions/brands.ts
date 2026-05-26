"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// =====================================================
// Server actions pour CRUD Brand + DeviceModel
// =====================================================

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Accès non autorisé");
  }
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BrandSchema = z.object({
  id: z.string().optional(),
  // Premiere lettre majuscule (ou chiffre) — convention metier.
  name: z
    .string()
    .trim()
    .min(2, "Nom de marque trop court")
    .max(60)
    .refine(
      (v) => /^[A-Z0-9]/.test(v),
      "Le nom doit commencer par une majuscule",
    ),
});

export async function createBrand(formData: FormData) {
  await requireAdmin();
  const parsed = BrandSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    redirect(
      `/admin/marques?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }
  const name = parsed.data.name;
  try {
    await prisma.brand.create({
      data: { name, slug: slugify(name) },
    });
  } catch {
    redirect(
      `/admin/marques?error=${encodeURIComponent(`La marque "${name}" existe déjà`)}`,
    );
  }
  revalidatePath("/admin/marques");
  redirect("/admin/marques?saved=1");
}

export async function updateBrand(formData: FormData) {
  await requireAdmin();
  const parsed = BrandSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success || !parsed.data.id) {
    redirect(
      `/admin/marques?error=${encodeURIComponent(parsed.success ? "ID manquant" : parsed.error.errors[0]?.message ?? "")}`,
    );
  }
  const { id, name } = parsed.data;
  try {
    await prisma.brand.update({
      where: { id: id! },
      data: { name, slug: slugify(name) },
    });
  } catch {
    redirect(
      `/admin/marques?error=${encodeURIComponent("Échec de mise à jour (nom déjà utilisé ?)")}`,
    );
  }
  revalidatePath("/admin/marques");
  redirect("/admin/marques?saved=1");
}

export async function deleteBrand(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("ID manquant");
  // Verifie qu'aucun Product n'est rattache — si oui on bloque.
  const productCount = await prisma.product.count({ where: { brandId: id } });
  if (productCount > 0) {
    redirect(
      `/admin/marques?error=${encodeURIComponent(`Marque utilisée par ${productCount} produit(s) — impossible de supprimer`)}`,
    );
  }
  // Cascade : les DeviceModel rattaches sont supprimes automatiquement.
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/marques");
  redirect("/admin/marques?saved=1");
}

// ----------------------------------------------------- DeviceModel CRUD

const ModelSchema = z.object({
  id: z.string().optional(),
  brandId: z.string().min(1),
  // Le modele DOIT commencer par majuscule ou chiffre — convention metier
  // pour eviter "iphone" tout en bas (l'iPhone d'Apple commence par 'i'
  // minuscule mais on l'autorise via le regex en acceptant le prefixe i + Maj).
  name: z
    .string()
    .trim()
    .min(1, "Nom de modèle requis")
    .max(80)
    .refine(
      (v) => /^[A-Zi0-9]/.test(v),
      "Le modèle doit commencer par une majuscule (ou 'i' pour iPhone/iPad)",
    ),
  deviceType: z.enum(["SMARTPHONE", "TABLETTE", "ORDINATEUR_PORTABLE", "AUTRE"]),
});

export async function createDeviceModel(formData: FormData) {
  await requireAdmin();
  const parsed = ModelSchema.safeParse({
    brandId: formData.get("brandId"),
    name: formData.get("name"),
    deviceType: formData.get("deviceType"),
  });
  if (!parsed.success) {
    redirect(
      `/admin/marques?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "")}`,
    );
  }
  try {
    await prisma.deviceModel.create({ data: parsed.data });
  } catch {
    redirect(
      `/admin/marques?error=${encodeURIComponent(`Ce modèle existe déjà pour cette marque`)}`,
    );
  }
  revalidatePath("/admin/marques");
  redirect(`/admin/marques?saved=1#brand-${parsed.data.brandId}`);
}

export async function updateDeviceModel(formData: FormData) {
  await requireAdmin();
  const parsed = ModelSchema.safeParse({
    id: formData.get("id"),
    brandId: formData.get("brandId"),
    name: formData.get("name"),
    deviceType: formData.get("deviceType"),
  });
  if (!parsed.success || !parsed.data.id) {
    redirect(
      `/admin/marques?error=${encodeURIComponent(parsed.success ? "ID manquant" : parsed.error.errors[0]?.message ?? "")}`,
    );
  }
  await prisma.deviceModel.update({
    where: { id: parsed.data.id! },
    data: {
      name: parsed.data.name,
      deviceType: parsed.data.deviceType,
    },
  });
  revalidatePath("/admin/marques");
  redirect(`/admin/marques?saved=1#brand-${parsed.data.brandId}`);
}

export async function deleteDeviceModel(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  const brandId = formData.get("brandId");
  if (typeof id !== "string") throw new Error("ID manquant");
  await prisma.deviceModel.delete({ where: { id } });
  revalidatePath("/admin/marques");
  redirect(`/admin/marques?saved=1${typeof brandId === "string" ? `#brand-${brandId}` : ""}`);
}
