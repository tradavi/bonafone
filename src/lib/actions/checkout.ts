"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { generateNextOrderNumber } from "@/lib/queries";
import { sendEmail, tplOrderConfirmation } from "@/lib/notifications";
import { sendPushToAdmins } from "@/lib/push";
import { formatPrice } from "@/lib/utils";

// Aligné sur cart-view.tsx (front)
const SHIPPING_FREE_FROM = 50;
const SHIPPING_COST = 5.9;

const AddressSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis").max(120),
  line1: z.string().min(3, "Adresse requise").max(200),
  line2: z.string().max(200).optional(),
  postalCode: z.string().min(2, "Code postal requis").max(20),
  city: z.string().min(1, "Ville requise").max(100),
  country: z.string().min(2).max(60).default("Belgique"),
  phone: z.string().max(30).optional(),
});

const ItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive().max(50),
    }),
  )
  .min(1, "Panier vide");

const CreateOrderSchema = z.object({
  items: ItemsSchema,
  shippingAddress: AddressSchema,
  email: z.string().email("Email invalide"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export type CreateOrderResult =
  | { ok: true; redirectUrl: string; isExternal: boolean; orderNumber: string }
  | { ok: false; error: string };

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const parsed = CreateOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Données invalides" };
  }
  const { items, shippingAddress, email } = parsed.data;

  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Re-vérification autoritative en DB (prix + stock)
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    select: { id: true, name: true, price: true, stock: true, slug: true, primaryImage: true },
  });

  const productById = new Map(products.map((p) => [p.id, p]));
  for (const it of items) {
    const p = productById.get(it.productId);
    if (!p) return { ok: false, error: "Un produit du panier n'est plus disponible" };
    if (p.stock < it.quantity) {
      return { ok: false, error: `Stock insuffisant pour ${p.name} (reste ${p.stock})` };
    }
  }

  const subtotal = items.reduce((sum, it) => {
    const p = productById.get(it.productId)!;
    return sum + p.price * it.quantity;
  }, 0);
  const shippingCost = subtotal >= SHIPPING_FREE_FROM ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;

  const stripe = await getStripe();
  const isDemo = stripe === null;
  const orderNumber = await generateNextOrderNumber();

  // Création atomique : Order + OrderItems + décrémentation stock
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number: orderNumber,
        userId,
        guestEmail: userId ? null : email,
        status: isDemo ? "PAID" : "PENDING",
        paymentMethod: isDemo ? "DEMO" : "CARD",
        subtotal,
        shippingCost,
        total,
        currency: "EUR",
        shippingAddress: JSON.stringify(shippingAddress),
        items: {
          create: items.map((it) => {
            const p = productById.get(it.productId)!;
            return {
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: p.price,
              total: p.price * it.quantity,
            };
          }),
        },
      },
    });

    for (const it of items) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.quantity } },
      });
    }

    return created;
  });

  revalidatePath("/compte/commandes");
  revalidatePath("/admin");
  revalidatePath("/admin/commandes");

  if (isDemo) {
    // Mode démo : la commande est déjà PAID — on confirme tout de suite par email.
    const tpl = tplOrderConfirmation({
      customerName: shippingAddress.fullName,
      number: orderNumber,
      total: formatPrice(total),
    });
    await sendEmail({
      to: email,
      toName: shippingAddress.fullName,
      subject: tpl.subject,
      html: tpl.html,
    });
    sendPushToAdmins({
      title: "Nouvelle commande payée",
      body: `${orderNumber} — ${formatPrice(total)} · ${shippingAddress.fullName}`,
      url: `/admin/commandes/${orderNumber}`,
      tag: `order-${orderNumber}`,
    }).catch((err) => console.error("[createOrder] push:", err));
    return {
      ok: true,
      redirectUrl: `/checkout/success?ref=${orderNumber}`,
      isExternal: false,
      orderNumber,
    };
  }

  // Stripe configuré : créer une Checkout Session
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  try {
    const checkoutSession = await stripe!.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      client_reference_id: order.id,
      metadata: { orderNumber },
      line_items: [
        ...items.map((it) => {
          const p = productById.get(it.productId)!;
          return {
            quantity: it.quantity,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(p.price * 100),
              product_data: {
                name: p.name,
                images: p.primaryImage ? [p.primaryImage] : undefined,
              },
            },
          };
        }),
        ...(shippingCost > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "eur",
                  unit_amount: Math.round(shippingCost * 100),
                  product_data: { name: "Livraison" },
                },
              },
            ]
          : []),
      ],
      success_url: `${baseUrl}/checkout/success?ref=${orderNumber}`,
      cancel_url: `${baseUrl}/checkout/cancelled?ref=${orderNumber}`,
    });

    if (!checkoutSession.url) {
      return { ok: false, error: "Stripe n'a pas retourné d'URL de paiement" };
    }
    return {
      ok: true,
      redirectUrl: checkoutSession.url,
      isExternal: true,
      orderNumber,
    };
  } catch (err) {
    console.error("[createOrder] Stripe session create:", err);
    // Annuler l'ordre + restaurer le stock pour rester cohérent
    await cancelPendingOrderInternal(orderNumber);
    return { ok: false, error: "Le paiement n'a pas pu être initialisé. Réessayez." };
  }
}

// Idempotent : ne touche que les orders en PENDING.
async function cancelPendingOrderInternal(orderNumber: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { number: orderNumber },
      include: { items: true },
    });
    if (!order || order.status !== "PENDING") return;

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
  });
}

export async function cancelPendingOrder(orderNumber: string): Promise<{ ok: boolean }> {
  if (!orderNumber || typeof orderNumber !== "string") return { ok: false };
  await cancelPendingOrderInternal(orderNumber);
  revalidatePath("/compte/commandes");
  revalidatePath("/admin/commandes");
  return { ok: true };
}
