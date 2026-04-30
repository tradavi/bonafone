"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const NewsletterSchema = z.object({
  email: z.string().email(),
});

export async function subscribeNewsletter(formData: FormData) {
  let target: string;

  try {
    const raw: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
      if (typeof v === "string") raw[k] = v;
    }
    const parsed = NewsletterSchema.safeParse(raw);
    if (!parsed.success) {
      target = "/?newsletter=invalid";
    } else {
      await prisma.newsletterSubscriber.upsert({
        where: { email: parsed.data.email },
        update: { isActive: true },
        create: { email: parsed.data.email },
      });
      console.log(`📧 Nouvel abonné: ${parsed.data.email}`);
      target = "/?newsletter=ok";
    }
  } catch (err) {
    console.error("[subscribeNewsletter]", err);
    target = "/?newsletter=error";
  }

  redirect(target);
}
