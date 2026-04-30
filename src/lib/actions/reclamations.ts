"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateNextReclamationNumber } from "@/lib/queries";
import { sendEmail, tplReclamationReceived } from "@/lib/notifications";

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
      await prisma.reclamation.create({
        data: {
          number,
          email: data.email,
          phone: data.phone,
          type: data.type,
          orderRef: data.orderRef,
          description: data.description,
          status: "OUVERTE",
        },
      });
      const tpl = tplReclamationReceived({ number });
      await sendEmail({
        to: data.email,
        subject: tpl.subject,
        html: tpl.html,
      });
      revalidatePath("/admin/reclamations");
      target = `/reclamations?sent=${number}`;
    }
  } catch (err) {
    console.error("[createReclamation]", err);
    target = `/reclamations?error=${encodeURIComponent("Erreur, réessayez.")}`;
  }

  redirect(target);
}
