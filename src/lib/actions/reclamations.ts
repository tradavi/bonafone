"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateNextReclamationNumber } from "@/lib/queries";
import { sendEmail, tplReclamationReceived } from "@/lib/notifications";
import { sendPushToAdmins } from "@/lib/push";
import { saveUploadedImage, isImageFile } from "@/lib/uploads";

const TYPE_LABEL: Record<string, string> = {
  COMMANDE: "commande",
  REPARATION: "réparation",
  LIVRAISON: "livraison",
  PRODUIT_DEFECTUEUX: "produit défectueux",
  AUTRE: "autre",
};

const MAX_PHOTOS = 5;

const ReclamationSchema = z.object({
  type: z.enum(["COMMANDE", "REPARATION", "LIVRAISON", "PRODUIT_DEFECTUEUX", "AUTRE"]),
  orderRef: z.string().max(50).optional(),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  description: z.string().min(10, "Description trop courte (10 caractères min)").max(5000),
});

export async function createReclamation(formData: FormData) {
  let target: string;

  try {
    // Extraction texte (les fichiers sont traités séparément plus bas)
    const raw: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
      if (typeof v === "string") raw[k] = v;
    }
    const parsed = ReclamationSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Formulaire invalide";
      target = `/reclamations?error=${encodeURIComponent(msg)}`;
    } else {
      const data = parsed.data;
      const number = await generateNextReclamationNumber();

      // 1) Crée d'abord le dossier (sans attachments) pour générer l'ID + dossier d'upload
      const reclamation = await prisma.reclamation.create({
        data: {
          number,
          email: data.email,
          phone: data.phone,
          type: data.type,
          orderRef: data.orderRef,
          description: data.description,
          status: "OUVERTE",
        },
        select: { id: true },
      });

      // 2) Sauvegarde les photos uploadées (tolérante : on n'échoue pas tout
      //    pour une image qui casse — pattern identique à createDevis)
      const photoFiles = formData
        .getAll("photos")
        .filter(isImageFile)
        .slice(0, MAX_PHOTOS);
      const savedPhotos: { url: string; name: string }[] = [];
      for (const file of photoFiles) {
        try {
          const uploaded = await saveUploadedImage(file, `reclamations/${reclamation.id}`);
          savedPhotos.push({ url: uploaded.url, name: file.name });
        } catch (err) {
          console.error("[createReclamation] photo skip:", err);
        }
      }
      // 3) Si des photos ont été sauvegardées, on met à jour la ligne avec
      //    le JSON des attachments. Format : [{url, name}].
      if (savedPhotos.length > 0) {
        await prisma.reclamation.update({
          where: { id: reclamation.id },
          data: { attachments: JSON.stringify(savedPhotos) },
        });
      }

      const tpl = tplReclamationReceived({ number });
      await sendEmail({
        to: data.email,
        subject: tpl.subject,
        html: tpl.html,
      });
      const pushSuffix =
        savedPhotos.length > 0 ? ` · ${savedPhotos.length} photo${savedPhotos.length > 1 ? "s" : ""}` : "";
      sendPushToAdmins({
        title: "Nouvelle réclamation",
        body: `${data.email} — ${TYPE_LABEL[data.type] ?? data.type}${pushSuffix}`,
        url: `/admin/reclamations`,
        tag: `reclamation-${number}`,
      }).catch((err) => console.error("[createReclamation] push:", err));

      revalidatePath("/admin/reclamations");
      target = `/reclamations?sent=${number}`;
    }
  } catch (err) {
    console.error("[createReclamation]", err);
    target = `/reclamations?error=${encodeURIComponent("Erreur, réessayez.")}`;
  }

  redirect(target);
}
