"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(5).max(5000),
});

export async function sendContactMessage(formData: FormData) {
  let target: string;

  try {
    const raw: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
      if (typeof v === "string") raw[k] = v;
    }
    const parsed = ContactSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Formulaire invalide";
      target = `/contact?error=${encodeURIComponent(msg)}`;
    } else {
      const data = parsed.data;
      await prisma.contactMessage.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
        },
      });
      console.log(`📨 Message de contact de ${data.email} — ${data.subject}`);
      target = "/contact?sent=1";
    }
  } catch (err) {
    console.error("[sendContactMessage]", err);
    target = `/contact?error=${encodeURIComponent("Erreur, réessayez.")}`;
  }

  redirect(target);
}
