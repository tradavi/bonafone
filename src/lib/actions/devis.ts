"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateNextRepairNumber } from "@/lib/queries";
import { sendEmail, tplDevisReceived } from "@/lib/notifications";
import { saveUploadedImage, isImageFile } from "@/lib/uploads";
import { sendPushToAdmins } from "@/lib/push";

const MAX_PHOTOS = 5;

const DevisSchema = z.object({
  deviceType: z.enum(["SMARTPHONE", "TABLETTE", "ORDINATEUR_PORTABLE", "AUTRE"]),
  brand: z.string().min(1, "Marque requise").max(100),
  model: z.string().min(1, "Modèle requis").max(100),
  issueType: z.string().min(1, "Type de panne requis").max(100),
  issueDescription: z.string().min(10, "Décrivez le problème (10 caractères min)").max(2000),
  customerName: z.string().min(2, "Nom requis").max(100),
  customerPhone: z.string().min(6, "Téléphone requis").max(30),
  customerEmail: z.string().email("Email invalide"),
  contactPref: z.enum(["EMAIL", "TELEPHONE", "WHATSAPP"]).default("EMAIL"),
  preferredDropAt: z.string().optional(),
});

export async function createDevis(formData: FormData) {
  // Cibles possibles. On choisit la bonne en fin de fonction et on redirige hors try/catch
  // pour que NEXT_REDIRECT ne soit jamais avalé par le catch.
  let target: string;

  try {
    // Extraction texte uniquement (un input file éventuel est ignoré ici).
    const raw: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") raw[key] = value;
    }

    const parsed = DevisSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Formulaire invalide";
      target = `/reparations/devis?error=${encodeURIComponent(msg)}`;
    } else {
      const data = parsed.data;

      // Anti-duplication : protection contre double-clic / replay côté public.
      // Même logique que createRepairAdmin : fenêtre 2 min, match sur (téléphone,
      // marque, modèle, type de panne). Évite qu'un client impatient clique
      // 3 fois et crée 3 demandes de devis identiques.
      const phoneDigitsKey = data.customerPhone.replace(/\D/g, "").slice(-9);
      let duplicateNumber: string | null = null;
      if (phoneDigitsKey.length >= 6) {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const recentDuplicate = await prisma.repair.findFirst({
          where: {
            createdAt: { gte: twoMinutesAgo },
            brand: data.brand,
            model: data.model,
            issueType: data.issueType,
            customerPhone: { contains: phoneDigitsKey },
          },
          select: { number: true },
          orderBy: { createdAt: "desc" },
        });
        if (recentDuplicate) {
          console.warn(
            `[createDevis] doublon détecté pour ${data.customerPhone} (${data.brand} ${data.model}) — redirection vers ${recentDuplicate.number}`,
          );
          duplicateNumber = recentDuplicate.number;
        }
      }
      if (duplicateNumber) {
        // On évite tout le reste (create + photos + email + push) — la 1re
        // soumission a déjà tout fait il y a moins de 2 min.
        target = `/reparations/devis/confirmation?ref=${duplicateNumber}`;
        // Fallthrough out of try — la redirection finale se fait après le catch.
      } else {

      const number = await generateNextRepairNumber();
      // Si l'utilisateur est connecté, on rattache la réparation à son compte.
      const session = await auth();
      const userId = session?.user?.id;

      const repair = await prisma.repair.create({
        data: {
          number,
          userId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          contactPref: data.contactPref,
          deviceType: data.deviceType,
          brand: data.brand,
          model: data.model,
          issueType: data.issueType,
          issueDescription: data.issueDescription,
          preferredDropAt: data.preferredDropAt
            ? new Date(data.preferredDropAt)
            : null,
          // Demande de devis en ligne : pas encore d'appareil reçu en boutique.
          // Le statut passera à RECU lors du dépôt physique (action convertDevisToRepair).
          status: "DEMANDE_DEVIS",
          depositedAt: null,
        },
      });

      // Photos optionnelles attachées à la demande — on tolère les erreurs unitaires
      // pour ne pas perdre toute la demande si une image est invalide.
      const photoFiles = formData
        .getAll("photos")
        .filter(isImageFile)
        .slice(0, MAX_PHOTOS);
      let savedPhotos = 0;
      for (const file of photoFiles) {
        try {
          const uploaded = await saveUploadedImage(file, `repairs/${repair.id}`);
          await prisma.repairPhoto.create({
            data: { repairId: repair.id, url: uploaded.url },
          });
          savedPhotos++;
        } catch (err) {
          console.error("[createDevis] photo skip:", err);
        }
      }

      await prisma.repairStatusEvent.create({
        data: {
          repairId: repair.id,
          status: "DEMANDE_DEVIS",
          comment:
            savedPhotos > 0
              ? `Demande de devis reçue via le formulaire en ligne (${savedPhotos} photo${savedPhotos > 1 ? "s" : ""})`
              : "Demande de devis reçue via le formulaire en ligne",
        },
      });

      const tpl = tplDevisReceived({
        customerName: data.customerName,
        number,
        device: `${data.brand} ${data.model}`,
        issueType: data.issueType,
      });
      await sendEmail({
        to: data.customerEmail,
        toName: data.customerName,
        subject: tpl.subject,
        html: tpl.html,
      });

      // Push notification aux admins — non-bloquant si VAPID pas configuré.
      sendPushToAdmins({
        title: "Nouvelle demande de devis",
        body: `${data.customerName} — ${data.brand} ${data.model} (${data.issueType})`,
        url: `/admin/devis`,
        tag: `devis-${number}`,
      }).catch((err) => console.error("[createDevis] push:", err));

      revalidatePath("/admin/reparations");
      revalidatePath("/admin");
      target = `/reparations/devis/confirmation?ref=${number}`;
      }
    }
  } catch (err) {
    console.error("[createDevis] erreur inattendue:", err);
    target = `/reparations/devis?error=${encodeURIComponent(
      "Une erreur est survenue, réessayez.",
    )}`;
  }

  redirect(target);
}
