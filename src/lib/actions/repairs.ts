"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, sendSms, tplRepairStatus, tplRepairQuote } from "@/lib/notifications";
import { formatPrice } from "@/lib/utils";

const STATUSES = [
  "RECU",
  "DIAGNOSTIC",
  "DEVIS_VALIDE",
  "EN_REPARATION",
  "ATTENTE_PIECE",
  "TERMINE",
  "PRET_RECUPERATION",
  "ATTENTE_RESTITUTION", // client a refusé le devis, attend de récupérer l'appareil non réparé
  "RESTITUE",
  "IRREPARABLE",
] as const;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Accès non autorisé");
  }
  return session.user;
}

// =====================================================
// CHANGER LE STATUT
// =====================================================

const StatusSchema = z.object({
  repairId: z.string().min(1),
  status: z.enum(STATUSES),
  comment: z.string().max(2000).optional(),
});

export async function updateRepairStatus(formData: FormData) {
  const user = await requireAdmin();

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }

  const parsed = StatusSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);

  const { repairId, status, comment } = parsed.data;

  await prisma.$transaction([
    prisma.repair.update({
      where: { id: repairId },
      data: { status },
    }),
    prisma.repairStatusEvent.create({
      data: {
        repairId,
        status,
        comment: comment || null,
        createdBy: user.id,
      },
    }),
  ]);

  const repair = await prisma.repair.findUnique({
    where: { id: repairId },
    select: {
      number: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      contactPref: true,
    },
  });

  if (repair) {
    const tpl = tplRepairStatus({
      customerName: repair.customerName,
      number: repair.number,
      status,
      comment: comment || undefined,
    });
    // Email seulement si on en a un — certains dossiers boutique sont sans email.
    if (repair.customerEmail) {
      await sendEmail({
        to: repair.customerEmail,
        toName: repair.customerName,
        subject: tpl.subject,
        html: tpl.html,
      });
    }
    // SMS si la préférence le demande et qu'on a un numéro
    if (
      (repair.contactPref === "TELEPHONE" || repair.contactPref === "WHATSAPP") &&
      repair.customerPhone
    ) {
      await sendSms({ to: repair.customerPhone, body: tpl.sms });
    }
  }

  revalidatePath("/admin/reparations");
  revalidatePath("/admin");
  if (repair) {
    revalidatePath(`/admin/reparations/${repair.number}`);
    revalidatePath(`/reparations/suivi`);
  }

  // Auto-impression du bon de garantie au passage en RESTITUE.
  // Le redirect doit etre HORS du try/catch (NEXT_REDIRECT) — ici on est
  // deja hors try donc OK. Le print=1 declenche AutoPrint cote client.
  // L'admin peut toujours revenir sur la page /garantie via le lien
  // "Garantie" sur la fiche du dossier.
  if (status === "RESTITUE" && repair) {
    redirect(`/admin/reparations/${repair.number}/garantie?print=1`);
  }
}

// =====================================================
// METTRE À JOUR LES COÛTS
// =====================================================

const CostSchema = z.object({
  repairId: z.string().min(1),
  estimatedCost: z.coerce.number().min(0).optional(),
  finalCost: z.coerce.number().min(0).optional(),
});

export async function updateRepairCost(formData: FormData) {
  await requireAdmin();

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && v !== "") raw[k] = v;
  }

  const parsed = CostSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);

  const { repairId, estimatedCost, finalCost } = parsed.data;

  await prisma.repair.update({
    where: { id: repairId },
    data: {
      ...(estimatedCost !== undefined && { estimatedCost }),
      ...(finalCost !== undefined && { finalCost }),
    },
  });

  const repair = await prisma.repair.findUnique({
    where: { id: repairId },
    select: { number: true },
  });
  if (repair) revalidatePath(`/admin/reparations/${repair.number}`);
}

// =====================================================
// AJOUTER UNE PIÈCE
// =====================================================

const PartSchema = z.object({
  repairId: z.string().min(1),
  name: z.string().min(1, "Nom requis").max(200),
  supplier: z.string().max(200).optional(),
  cost: z.coerce.number().min(0),
  estimatedDays: z.coerce.number().int().min(0).max(365).optional(),
});

export async function addRepairPart(formData: FormData) {
  await requireAdmin();

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && v !== "") raw[k] = v;
  }

  const parsed = PartSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);

  const { repairId, name, supplier, cost, estimatedDays } = parsed.data;

  await prisma.repairPart.create({
    data: {
      repairId,
      name,
      supplier,
      cost,
      estimatedDays,
      orderedAt: new Date(),
    },
  });

  const repair = await prisma.repair.findUnique({
    where: { id: repairId },
    select: { number: true },
  });
  if (repair) revalidatePath(`/admin/reparations/${repair.number}`);
}

// =====================================================
// METTRE À JOUR LES NOTES INTERNES
// =====================================================

const NotesSchema = z.object({
  repairId: z.string().min(1),
  internalNotes: z.string().max(5000),
});

export async function updateInternalNotes(formData: FormData) {
  await requireAdmin();

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }

  const parsed = NotesSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);

  const { repairId, internalNotes } = parsed.data;

  await prisma.repair.update({
    where: { id: repairId },
    data: { internalNotes },
  });

  const repair = await prisma.repair.findUnique({
    where: { id: repairId },
    select: { number: true },
  });
  if (repair) revalidatePath(`/admin/reparations/${repair.number}`);
}

// =====================================================
// SUPPRIMER UNE PIÈCE
// =====================================================

export async function deleteRepairPart(formData: FormData) {
  await requireAdmin();
  const partId = formData.get("partId");
  if (typeof partId !== "string") throw new Error("ID pièce manquant");

  const part = await prisma.repairPart.findUnique({
    where: { id: partId },
    select: { repair: { select: { number: true } } },
  });
  await prisma.repairPart.delete({ where: { id: partId } });

  if (part?.repair) revalidatePath(`/admin/reparations/${part.repair.number}`);
}

// =====================================================
// MODIFIER LES CHAMPS CŒUR DU DOSSIER
// =====================================================
// (client, appareil, panne, dates, IMEI). Le statut, les coûts,
// les pièces et les notes ont leurs propres actions plus haut.

const CoreSchema = z.object({
  repairId: z.string().min(1),
  customerName: z.string().min(2).max(120),
  customerEmail: z.union([z.string().email(), z.literal("")]).optional(),
  customerPhone: z.string().min(6).max(30),
  contactPref: z.enum(["EMAIL", "TELEPHONE", "WHATSAPP"]).default("EMAIL"),
  deviceType: z.enum(["SMARTPHONE", "TABLETTE", "ORDINATEUR_PORTABLE", "AUTRE"]),
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  imei: z.string().max(50).optional(),
  issueType: z.string().min(1).max(100),
  issueDescription: z.string().min(5).max(2000),
  preferredDropAt: z.string().optional(),
  estimatedReadyAt: z.string().optional(),
  paymentStatus: z.enum(["NON_PAYE", "ACOMPTE", "PAYE"]).optional(),
  paidAmount: z.coerce.number().min(0).optional(),
});

export async function updateRepairCore(formData: FormData) {
  await requireAdmin();

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }

  const parsed = CoreSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);

  const data = parsed.data;

  // Coherence paiement (idem createRepairAdmin) : derive paidAmount selon
  // le statut. Si PAYE et pas de montant → on prend estimatedCost si dispo.
  let paymentUpdate: { paymentStatus?: string; paidAmount?: number | null } = {};
  if (data.paymentStatus !== undefined) {
    const existing = await prisma.repair.findUnique({
      where: { id: data.repairId },
      select: { estimatedCost: true },
    });
    const total = existing?.estimatedCost ?? 0;
    const finalPaid =
      data.paymentStatus === "PAYE"
        ? (data.paidAmount ?? total)
        : data.paymentStatus === "ACOMPTE"
          ? (data.paidAmount ?? 0)
          : 0;
    paymentUpdate = { paymentStatus: data.paymentStatus, paidAmount: finalPaid };
  }

  await prisma.repair.update({
    where: { id: data.repairId },
    data: {
      customerName: data.customerName,
      customerEmail: data.customerEmail ? data.customerEmail.toLowerCase() : null,
      customerPhone: data.customerPhone,
      contactPref: data.contactPref,
      deviceType: data.deviceType,
      brand: data.brand,
      model: data.model,
      imei: data.imei || null,
      issueType: data.issueType,
      issueDescription: data.issueDescription,
      preferredDropAt: data.preferredDropAt ? new Date(data.preferredDropAt) : null,
      estimatedReadyAt: data.estimatedReadyAt ? new Date(data.estimatedReadyAt) : null,
      ...paymentUpdate,
    },
  });

  const repair = await prisma.repair.findUnique({
    where: { id: data.repairId },
    select: { number: true },
  });
  revalidatePath("/admin/reparations");
  if (repair) {
    revalidatePath(`/admin/reparations/${repair.number}`);
    revalidatePath(`/reparations/suivi`);
  }
}

// =====================================================
// CONVERTIR UNE DEMANDE DE DEVIS EN RÉPARATION
// =====================================================
// Quand le client dépose physiquement son appareil :
// DEMANDE_DEVIS → RECU + depositedAt = now.

export async function convertDevisToRepair(formData: FormData) {
  const user = await requireAdmin();
  const repairId = formData.get("repairId");
  if (typeof repairId !== "string") throw new Error("ID manquant");

  const repair = await prisma.repair.findUnique({
    where: { id: repairId },
    select: { number: true, status: true },
  });
  if (!repair) throw new Error("Dossier introuvable");
  if (repair.status !== "DEMANDE_DEVIS") {
    throw new Error("Seules les demandes de devis peuvent être converties");
  }

  await prisma.$transaction([
    prisma.repair.update({
      where: { id: repairId },
      data: {
        status: "RECU",
        depositedAt: new Date(),
      },
    }),
    prisma.repairStatusEvent.create({
      data: {
        repairId,
        status: "RECU",
        comment: "Appareil réceptionné en boutique — démarrage de la réparation",
        createdBy: user.id,
      },
    }),
  ]);

  revalidatePath("/admin/devis");
  revalidatePath("/admin/reparations");
  revalidatePath(`/admin/reparations/${repair.number}`);
  revalidatePath("/admin");

  // Une fois converti, on imprime les tickets immédiatement.
  redirect(`/admin/reparations/${repair.number}/tickets?print=1`);
}

// =====================================================
// ARCHIVER (soft delete) — passe en RESTITUE pour sortir des actifs
// =====================================================

// =====================================================
// ENVOYER LE DEVIS AU CLIENT
// =====================================================

const QuoteSchema = z.object({
  repairId: z.string().min(1),
  message: z.string().max(2000).optional(),
});

export async function sendRepairQuote(formData: FormData) {
  // Cible de redirection finale — déterminée à la fin, hors try/catch pour que
  // NEXT_REDIRECT ne soit pas avalé. Pattern identique aux autres actions du repo.
  let target: string;
  let repairNumberForRedirect: string | null = null;

  try {
    const user = await requireAdmin();

    const raw: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
      if (typeof v === "string") raw[k] = v;
    }
    const parsed = QuoteSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(parsed.error.errors[0]?.message ?? "Formulaire invalide");
    }
    const { repairId, message } = parsed.data;

    const repair = await prisma.repair.findUnique({
      where: { id: repairId },
      include: { parts: { orderBy: { orderedAt: "asc" } } },
    });
    if (!repair) throw new Error("Dossier introuvable");
    repairNumberForRedirect = repair.number;

    if (!repair.customerEmail) {
      throw new Error("Aucun email client renseigné — impossible d'envoyer le devis");
    }
    if (repair.estimatedCost == null) {
      throw new Error("Définissez d'abord un coût estimé avant d'envoyer le devis");
    }

    const tpl = tplRepairQuote({
      customerName: repair.customerName,
      number: repair.number,
      device: `${repair.brand} ${repair.model}`,
      issueType: repair.issueType,
      totalTtc: repair.estimatedCost,
      parts: repair.parts.map((p) => ({ name: p.name, costTtc: p.cost })),
      message,
    });

    const result = await sendEmail({
      to: repair.customerEmail,
      toName: repair.customerName,
      subject: tpl.subject,
      html: tpl.html,
    });

    // ⚠ Vérification critique : si Brevo a rejeté l'envoi, on NE crée PAS
    // d'event "envoyé" (sinon ça ment au client) — on remonte l'erreur dans l'UI.
    if (!result.ok) {
      console.error("[sendRepairQuote] Brevo a refusé :", result.error);
      target = `/admin/reparations/${repair.number}?quoteError=${encodeURIComponent(
        result.error ?? "Envoi de l'email échoué (Brevo)",
      )}`;
    } else {
      await prisma.repairStatusEvent.create({
        data: {
          repairId: repair.id,
          status: repair.status,
          comment: result.skipped
            ? `Devis préparé pour ${repair.customerEmail} (mode démo — pas d'envoi réel : ${formatPrice(repair.estimatedCost)})`
            : `Devis envoyé à ${repair.customerEmail} (${formatPrice(repair.estimatedCost)})`,
          createdBy: user.id,
          notifiedClient: !result.skipped,
        },
      });

      revalidatePath("/admin/reparations");
      revalidatePath("/admin/devis");
      revalidatePath(`/admin/reparations/${repair.number}`);

      target = result.skipped
        ? `/admin/reparations/${repair.number}?quoteSent=demo`
        : `/admin/reparations/${repair.number}?quoteSent=1`;
    }
  } catch (err) {
    console.error("[sendRepairQuote] erreur :", err);
    const msg = err instanceof Error ? err.message : "Erreur inattendue";
    // Si on a déjà récupéré le numéro, on revient sur la fiche ; sinon, sur la liste.
    target = repairNumberForRedirect
      ? `/admin/reparations/${repairNumberForRedirect}?quoteError=${encodeURIComponent(msg)}`
      : `/admin/reparations?error=${encodeURIComponent(msg)}`;
  }

  redirect(target);
}

export async function archiveRepair(formData: FormData) {
  const user = await requireAdmin();
  const repairId = formData.get("repairId");
  if (typeof repairId !== "string") throw new Error("ID manquant");

  await prisma.$transaction([
    prisma.repair.update({
      where: { id: repairId },
      data: { status: "RESTITUE" },
    }),
    prisma.repairStatusEvent.create({
      data: {
        repairId,
        status: "RESTITUE",
        comment: "Dossier archivé (back-office)",
        createdBy: user.id,
        notifiedClient: false,
      },
    }),
  ]);

  revalidatePath("/admin/reparations");
  revalidatePath("/admin");
}

// =====================================================
// SUPPRIMER DÉFINITIVEMENT UN DOSSIER
// =====================================================
// Action destructive : supprime le dossier ET tous ses enfants
// (events, parts, photos, invoices) via les cascades du schéma Prisma.
// Redirige vers la liste — la page courante n'existerait plus.

export async function deleteRepair(formData: FormData) {
  await requireAdmin();
  const repairId = formData.get("repairId");
  if (typeof repairId !== "string") throw new Error("ID manquant");

  const repair = await prisma.repair.findUnique({
    where: { id: repairId },
    select: { number: true, status: true },
  });
  if (!repair) throw new Error("Dossier introuvable");

  // Suppression — les onDelete: Cascade sur les relations enfants gèrent le reste
  // (RepairStatusEvent, RepairPart, RepairPhoto, RepairInvoice).
  await prisma.repair.delete({ where: { id: repairId } });

  console.log(`🗑️  Dossier supprimé : ${repair.number}`);

  revalidatePath("/admin/reparations");
  revalidatePath("/admin/devis");
  revalidatePath("/admin");

  // La page /admin/reparations/[ref] courante n'existe plus → redirection.
  const target =
    repair.status === "DEMANDE_DEVIS" ? "/admin/devis" : "/admin/reparations";
  redirect(target);
}
