"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/queries";

/**
 * Soumet un avis depuis l'espace client.
 * - L'avis est créé avec isPublished = false (modération admin requise)
 * - source = INTERNE (provient du site, par opposition à Google/Facebook)
 * - rattaché au userId connecté
 */
const CreateMyReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Note requise").max(5),
  title: z.string().max(200).optional(),
  comment: z.string().min(10, "Décrivez votre expérience (10 caractères min)").max(2000),
});

export async function createMyReview(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion?callbackUrl=/compte/avis");
  }

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v.trim();
  }
  const parsed = CreateMyReviewSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/compte/avis?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }

  // Récupère le nom de l'utilisateur pour l'attribution publique
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, email: true },
  });

  const authorName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "Client";

  await prisma.review.create({
    data: {
      userId: session.user.id,
      authorName,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      comment: parsed.data.comment,
      source: "INTERNE",
      isPublished: false, // ← modération admin requise avant publication
    },
  });

  console.log(`⭐ Nouvel avis soumis par ${authorName} — en attente de modération`);

  revalidatePath("/compte/avis");
  revalidatePath("/admin/avis");
  redirect("/compte/avis?submitted=1");
}

/**
 * Suppression d'un avis par son auteur uniquement.
 * Garde-fou : on vérifie que l'avis appartient bien à l'utilisateur connecté.
 */
export async function deleteMyReview(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion?callbackUrl=/compte/avis");
  }

  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("ID manquant");

  const review = await prisma.review.findUnique({
    where: { id },
    select: { userId: true, isPublished: true },
  });
  if (!review) {
    redirect("/compte/avis?error=Avis+introuvable");
  }
  if (review.userId !== session.user.id) {
    redirect("/compte/avis?error=Action+non+autoris%C3%A9e");
  }

  await prisma.review.delete({ where: { id } });

  // Si l'avis était publié, on invalide aussi le cache public.
  if (review.isPublished) {
    revalidatePath("/temoignages");
    revalidatePath("/");
    updateTag(CACHE_TAGS.reviews);
  }
  revalidatePath("/compte/avis");
  revalidatePath("/admin/avis");
  redirect("/compte/avis?deleted=1");
}
