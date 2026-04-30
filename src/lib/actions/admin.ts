"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateNextRepairNumber } from "@/lib/queries";
import { saveUploadedImage, isImageFile } from "@/lib/uploads";
import {
  sendEmail,
  tplReclamationReply,
  tplContactReply,
} from "@/lib/notifications";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Accès non autorisé");
  }
  return session.user;
}

function readForm(fd: FormData): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  return raw;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

// =====================================================
// PRODUITS
// =====================================================

const ProductSchema = z.object({
  name: z.string().min(2, "Nom requis").max(200),
  slug: z.string().max(100).optional(),
  description: z.string().max(5000).default(""),
  category: z.enum(["SMARTPHONE", "TABLETTE", "ACCESSOIRE", "ORDINATEUR_PORTABLE"]),
  condition: z.enum(["RECONDITIONNE", "OCCASION"]).default("RECONDITIONNE"),
  grade: z.string().max(2).optional(),
  brandName: z.string().min(1, "Marque requise").max(100),
  price: z.coerce.number().min(0),
  originalPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockAt: z.coerce.number().int().min(0).default(3),
  warrantyMonths: z.coerce.number().int().min(0).default(24),
  barcode: z.string().max(50).optional(),
  badge: z.string().max(50).optional(),
  primaryImage: z.string().max(2000).optional(),
  isFeatured: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

async function upsertBrandByName(name: string) {
  const trimmed = name.trim();
  return prisma.brand.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed, slug: slugify(trimmed) || trimmed.toLowerCase() },
  });
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  // Checkboxes : present = "on", absent = undefined → on convertit en bool string
  raw.isFeatured = raw.isFeatured ? "true" : "false";
  raw.isActive = raw.isActive === undefined ? "true" : raw.isActive ? "true" : "false";

  // Image téléversée éventuelle — prioritaire sur l'URL textuelle
  const imageFile = formData.get("imageFile");
  if (isImageFile(imageFile)) {
    try {
      const uploaded = await saveUploadedImage(imageFile, "products");
      raw.primaryImage = uploaded.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur upload image";
      redirect(`/admin/produits/nouveau?error=${encodeURIComponent(msg)}`);
    }
  }

  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/admin/produits/nouveau?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }
  const data = parsed.data;
  // Code-barres : si déjà existant en DB, on bascule en mise à jour de l'existant
  // plutôt que de créer un doublon (le @unique du schéma protège déjà, mais on
  // veut une UX claire).
  if (data.barcode) {
    const existing = await prisma.product.findUnique({
      where: { barcode: data.barcode.trim() },
      select: { id: true },
    });
    if (existing) {
      redirect(
        `/admin/produits/${existing.id}?error=${encodeURIComponent(
          "Un produit existe déjà avec ce code-barres — vous pouvez le modifier ici.",
        )}`,
      );
    }
  }
  const brand = await upsertBrandByName(data.brandName);
  let slug = (data.slug || slugify(data.name)) || `produit-${Date.now()}`;
  // Garantir l'unicité du slug
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${(data.slug || slugify(data.name))}-${counter++}`;
  }
  const created = await prisma.product.create({
    data: {
      slug,
      name: data.name,
      description: data.description,
      category: data.category,
      condition: data.condition,
      grade: data.grade || null,
      brandId: brand.id,
      price: data.price,
      originalPrice: data.originalPrice ?? null,
      stock: data.stock,
      lowStockAt: data.lowStockAt,
      warrantyMonths: data.warrantyMonths,
      barcode: data.barcode?.trim() || null,
      badge: data.badge || null,
      primaryImage: data.primaryImage || null,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
    },
  });

  revalidatePath("/admin/produits");
  revalidatePath("/admin");
  revalidatePath("/boutique");
  redirect(`/admin/produits/${created.id}?saved=1`);
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  const id = raw.id;
  if (!id) throw new Error("ID produit manquant");
  raw.isFeatured = raw.isFeatured ? "true" : "false";
  raw.isActive = raw.isActive ? "true" : "false";

  const imageFile = formData.get("imageFile");
  if (isImageFile(imageFile)) {
    try {
      const uploaded = await saveUploadedImage(imageFile, "products");
      raw.primaryImage = uploaded.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur upload image";
      redirect(`/admin/produits/${id}?error=${encodeURIComponent(msg)}`);
    }
  }

  const parsed = ProductSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/admin/produits/${id}?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }
  const data = parsed.data;
  const brand = await upsertBrandByName(data.brandName);

  let slug = data.slug?.trim() || undefined;
  if (slug) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      redirect(`/admin/produits/${id}?error=${encodeURIComponent("Slug déjà utilisé")}`);
    }
  }

  // Vérifier l'unicité du code-barres (on autorise vide → null)
  const barcode = data.barcode?.trim() || null;
  if (barcode) {
    const dupe = await prisma.product.findUnique({ where: { barcode }, select: { id: true } });
    if (dupe && dupe.id !== id) {
      redirect(
        `/admin/produits/${id}?error=${encodeURIComponent("Code-barres déjà attribué à un autre produit")}`,
      );
    }
  }

  await prisma.product.update({
    where: { id },
    data: {
      ...(slug && { slug }),
      name: data.name,
      description: data.description,
      category: data.category,
      condition: data.condition,
      grade: data.grade || null,
      brandId: brand.id,
      price: data.price,
      originalPrice: data.originalPrice ?? null,
      stock: data.stock,
      lowStockAt: data.lowStockAt,
      warrantyMonths: data.warrantyMonths,
      barcode,
      badge: data.badge || null,
      primaryImage: data.primaryImage || null,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
    },
  });

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${id}`);
  revalidatePath("/admin");
  revalidatePath("/boutique");
  redirect(`/admin/produits/${id}?saved=1`);
}

export async function adjustProductStock(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  const delta = Number(formData.get("delta"));
  if (typeof id !== "string" || !Number.isFinite(delta) || delta === 0) {
    throw new Error("Paramètres invalides");
  }
  await prisma.product.update({
    where: { id },
    data: { stock: { increment: delta } },
  });
  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${id}`);
  revalidatePath("/admin");
}

export async function archiveProduct(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("ID manquant");
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin/produits");
  revalidatePath("/admin");
  revalidatePath("/boutique");
  redirect("/admin/produits?archived=1");
}

// =====================================================
// RÉPARATIONS — création manuelle (back-office)
// =====================================================

const CreateRepairSchema = z.object({
  clientId: z.string().optional(),
  customerName: z.string().min(2).max(120),
  customerEmail: z.union([z.string().email(), z.literal("")]).optional(),
  customerPhone: z.string().min(6).max(30),
  contactPref: z.enum(["EMAIL", "TELEPHONE", "WHATSAPP"]).default("TELEPHONE"),
  deviceType: z.enum(["SMARTPHONE", "TABLETTE", "ORDINATEUR_PORTABLE", "AUTRE"]),
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  imei: z.string().max(50).optional(),
  issueType: z.string().min(1).max(100),
  issueDescription: z.string().min(5).max(2000),
  estimatedCost: z.coerce.number().min(0).optional(),
  internalNotes: z.string().max(5000).optional(),
});

export async function createRepairAdmin(formData: FormData) {
  const user = await requireAdmin();
  const raw = readForm(formData);
  const parsed = CreateRepairSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/admin/reparations/nouveau?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }
  const data = parsed.data;

  const number = await generateNextRepairNumber();
  // Priorité 1 : client sélectionné via autocomplétion
  // Priorité 2 : fallback email match
  let userId: string | null = null;
  if (data.clientId) {
    const exists = await prisma.user.findUnique({
      where: { id: data.clientId },
      select: { id: true },
    });
    userId = exists?.id ?? null;
  }
  if (!userId && data.customerEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.customerEmail.toLowerCase() },
      select: { id: true },
    });
    userId = existingUser?.id ?? null;
  }

  const repair = await prisma.repair.create({
    data: {
      number,
      userId,
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
      estimatedCost: data.estimatedCost ?? null,
      internalNotes: data.internalNotes || null,
      // Dossier créé directement en back-office = appareil déjà reçu.
      status: "RECU",
      depositedAt: new Date(),
    },
  });

  await prisma.repairStatusEvent.create({
    data: {
      repairId: repair.id,
      status: "RECU",
      comment: "Dossier créé en back-office (appareil reçu)",
      createdBy: user.id,
    },
  });

  revalidatePath("/admin/reparations");
  revalidatePath("/admin");
  // Redirect vers les tickets pour impression immédiate
  redirect(`/admin/reparations/${number}/tickets?print=1`);
}

// =====================================================
// COMMANDES
// =====================================================

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const OrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
});

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  const parsed = OrderStatusSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);
  const { orderId, status } = parsed.data;

  await prisma.order.update({ where: { id: orderId }, data: { status } });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { number: true },
  });
  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
  revalidatePath("/compte/commandes");
  if (order) revalidatePath(`/admin/commandes/${order.number}`);
}

const OrderTrackingSchema = z.object({
  orderId: z.string().min(1),
  carrier: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export async function updateOrderTracking(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  const parsed = OrderTrackingSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);
  const { orderId, carrier, trackingNumber, notes } = parsed.data;
  await prisma.order.update({
    where: { id: orderId },
    data: {
      carrier: carrier || null,
      trackingNumber: trackingNumber || null,
      notes: notes || null,
    },
  });
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { number: true },
  });
  revalidatePath("/admin/commandes");
  if (order) revalidatePath(`/admin/commandes/${order.number}`);
}

// =====================================================
// AVIS — modération
// =====================================================

export async function toggleReviewPublished(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("ID manquant");
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new Error("Avis introuvable");
  await prisma.review.update({
    where: { id },
    data: { isPublished: !review.isPublished },
  });
  revalidatePath("/admin/avis");
  revalidatePath("/temoignages");
  revalidatePath("/");
}

export async function toggleReviewFeatured(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("ID manquant");
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new Error("Avis introuvable");
  await prisma.review.update({
    where: { id },
    data: { isFeatured: !review.isFeatured },
  });
  revalidatePath("/admin/avis");
  revalidatePath("/temoignages");
  revalidatePath("/");
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("ID manquant");
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/avis");
  revalidatePath("/temoignages");
  revalidatePath("/");
}

const NewReviewSchema = z.object({
  authorName: z.string().min(2).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().min(5).max(2000),
  source: z.enum(["INTERNE", "GOOGLE", "FACEBOOK"]).default("INTERNE"),
  isFeatured: z.coerce.boolean().default(false),
});

export async function createReview(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  raw.isFeatured = raw.isFeatured ? "true" : "false";
  const parsed = NewReviewSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/admin/avis?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }
  const data = parsed.data;
  await prisma.review.create({
    data: {
      authorName: data.authorName,
      rating: data.rating,
      title: data.title || null,
      comment: data.comment,
      source: data.source,
      isFeatured: data.isFeatured,
      isPublished: true,
    },
  });
  revalidatePath("/admin/avis");
  revalidatePath("/temoignages");
  revalidatePath("/");
  redirect("/admin/avis?created=1");
}

// =====================================================
// RÉCLAMATIONS
// =====================================================

const ReclamationStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OUVERTE", "EN_COURS", "RESOLUE", "CLOSE"]),
  assignedTo: z.string().max(120).optional(),
  internalNotes: z.string().max(5000).optional(),
});

export async function updateReclamationStatus(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  const parsed = ReclamationStatusSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);
  await prisma.reclamation.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      assignedTo: parsed.data.assignedTo || null,
      internalNotes: parsed.data.internalNotes?.trim() || null,
    },
  });
  revalidatePath("/admin/reclamations");
}

const ReclamationReplySchema = z.object({
  id: z.string().min(1),
  message: z.string().min(5, "Message trop court").max(5000),
});

export async function sendReclamationReply(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  const parsed = ReclamationReplySchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);

  const recl = await prisma.reclamation.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, number: true, email: true, history: true, status: true },
  });
  if (!recl) throw new Error("Réclamation introuvable");
  if (!recl.email) throw new Error("Aucun email client renseigné");

  const tpl = tplReclamationReply({
    number: recl.number,
    message: parsed.data.message,
  });
  const result = await sendEmail({
    to: recl.email,
    subject: tpl.subject,
    html: tpl.html,
  });

  // Log dans history (JSON stringified)
  let history: Array<{ at: string; type: string; message: string }> = [];
  if (recl.history) {
    try {
      const parsed = JSON.parse(recl.history);
      if (Array.isArray(parsed)) history = parsed;
    } catch {
      history = [];
    }
  }
  history.push({
    at: new Date().toISOString(),
    type: result.skipped ? "REPLY_DRAFT" : "REPLY_SENT",
    message: parsed.data.message,
  });

  // Si la réclamation était OUVERTE, on la passe en EN_COURS automatiquement
  await prisma.reclamation.update({
    where: { id: recl.id },
    data: {
      history: JSON.stringify(history),
      status: recl.status === "OUVERTE" ? "EN_COURS" : recl.status,
    },
  });

  revalidatePath("/admin/reclamations");
}

// =====================================================
// MESSAGES DE CONTACT
// =====================================================

export async function deleteContactMessage(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("ID manquant");
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath("/admin/messages");
}

const ContactNotesSchema = z.object({
  id: z.string().min(1),
  internalNotes: z.string().max(5000).optional(),
});

export async function updateContactNotes(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  const parsed = ContactNotesSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);
  await prisma.contactMessage.update({
    where: { id: parsed.data.id },
    data: { internalNotes: parsed.data.internalNotes?.trim() || null },
  });
  revalidatePath("/admin/messages");
}

const ContactReplySchema = z.object({
  id: z.string().min(1),
  message: z.string().min(5, "Message trop court").max(5000),
});

export async function replyToContactMessage(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  const parsed = ContactReplySchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);

  const msg = await prisma.contactMessage.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, name: true, email: true, subject: true, history: true },
  });
  if (!msg) throw new Error("Message introuvable");
  if (!msg.email) throw new Error("Aucun email destinataire");

  const tpl = tplContactReply({
    customerName: msg.name,
    subject: msg.subject,
    message: parsed.data.message,
  });
  const result = await sendEmail({
    to: msg.email,
    toName: msg.name,
    subject: tpl.subject,
    html: tpl.html,
  });

  // Log dans history (JSON stringified)
  let history: Array<{ at: string; type: string; message: string }> = [];
  if (msg.history) {
    try {
      const parsed = JSON.parse(msg.history);
      if (Array.isArray(parsed)) history = parsed;
    } catch {
      history = [];
    }
  }
  history.push({
    at: new Date().toISOString(),
    type: result.skipped ? "REPLY_DRAFT" : "REPLY_SENT",
    message: parsed.data.message,
  });

  await prisma.contactMessage.update({
    where: { id: msg.id },
    data: { history: JSON.stringify(history) },
  });

  revalidatePath("/admin/messages");
}

// =====================================================
// CLIENTS
// =====================================================

const CreateClientSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().max(30).optional(),
  role: z.enum(["CLIENT", "TECHNICIEN"]).default("CLIENT"),
});

export async function createClientAdmin(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  const parsed = CreateClientSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(
      `/admin/clients/nouveau?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Formulaire invalide")}`,
    );
  }
  const data = parsed.data;
  const email = data.email ? data.email.toLowerCase() : null;

  if (email) {
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) {
      redirect(
        `/admin/clients/nouveau?error=${encodeURIComponent("Un compte existe déjà avec cet email")}`,
      );
    }
  }

  // Email exigé par le schéma User.email (unique). Si absent, on génère un email
  // placeholder local pour pouvoir créer la fiche : preserve l'unicité et marque
  // le compte comme "sans email réel" (peut être complété plus tard).
  const created = await prisma.user.create({
    data: {
      email: email ?? `client-${Date.now()}@noemail.local`,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      role: data.role,
      loyalty: { create: {} },
    },
  });

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${created.id}?saved=1`);
}

const UpdateClientSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().max(30).optional(),
  role: z.enum(["CLIENT", "TECHNICIEN", "ADMIN"]),
});

export async function updateClientAdmin(formData: FormData) {
  const session = await requireAdmin();
  const raw = readForm(formData);
  const parsed = UpdateClientSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message);
  }
  const data = parsed.data;

  // Garde-fou : un admin ne peut pas se rétrograder lui-même
  if (data.id === session.id && data.role !== "ADMIN") {
    redirect(
      `/admin/clients/${data.id}?error=${encodeURIComponent("Vous ne pouvez pas changer votre propre rôle")}`,
    );
  }

  const newEmail = data.email ? data.email.toLowerCase() : null;
  if (newEmail) {
    const dupe = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
    if (dupe && dupe.id !== data.id) {
      redirect(
        `/admin/clients/${data.id}?error=${encodeURIComponent("Email déjà utilisé par un autre compte")}`,
      );
    }
  }

  await prisma.user.update({
    where: { id: data.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      ...(newEmail !== null && { email: newEmail }),
      phone: data.phone || null,
      role: data.role,
    },
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${data.id}`);
  redirect(`/admin/clients/${data.id}?saved=1`);
}

// Adresses
const AddressSchema = z.object({
  userId: z.string().min(1),
  label: z.string().max(60).optional(),
  fullName: z.string().min(2).max(120),
  street: z.string().min(2).max(200),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(2).max(20),
  country: z.string().max(60).default("BE"),
  phone: z.string().max(30).optional(),
  isDefault: z.coerce.boolean().default(false),
});

export async function addClientAddress(formData: FormData) {
  await requireAdmin();
  const raw = readForm(formData);
  raw.isDefault = raw.isDefault ? "true" : "false";
  const parsed = AddressSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message);
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      // Une seule adresse par défaut par client
      await tx.address.updateMany({
        where: { userId: data.userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    await tx.address.create({
      data: {
        userId: data.userId,
        label: data.label || null,
        fullName: data.fullName,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone || null,
        isDefault: data.isDefault,
      },
    });
  });

  revalidatePath(`/admin/clients/${data.userId}`);
}

export async function deleteClientAddress(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("ID manquant");
  const addr = await prisma.address.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!addr) return;
  await prisma.address.delete({ where: { id } });
  revalidatePath(`/admin/clients/${addr.userId}`);
}

// Suppression : on bloque si le client a des commandes ou réparations rattachées
// (intégrité historique). On propose alors juste de "détacher" en passant userId
// sur les ressources liées à null si vraiment besoin (pas implémenté).
export async function deleteClientAdmin(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("ID manquant");
  if (id === session.id) {
    throw new Error("Impossible de supprimer votre propre compte");
  }

  const counts = await prisma.user.findUnique({
    where: { id },
    select: { _count: { select: { orders: true, repairs: true } } },
  });
  if (!counts) return;
  if (counts._count.orders > 0 || counts._count.repairs > 0) {
    redirect(
      `/admin/clients/${id}?error=${encodeURIComponent(
        "Suppression impossible : ce client a des commandes ou réparations rattachées",
      )}`,
    );
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}
