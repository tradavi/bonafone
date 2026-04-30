import { prisma } from "@/lib/prisma";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { sendEmail, tplOrderConfirmation } from "@/lib/notifications";
import { formatPrice } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = await getStripe();
  const secret = await getStripeWebhookSecret();
  const sig = request.headers.get("stripe-signature");

  // Webhook désactivé tant que Stripe n'est pas configuré : on accuse réception poliment.
  if (!stripe || !secret || !sig) {
    return new Response("webhook disabled", { status: 200 });
  }

  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    return new Response(`Webhook signature error: ${message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderNumber = session.metadata?.orderNumber;
      if (orderNumber) {
        const result = await prisma.order.updateMany({
          where: { number: orderNumber, status: "PENDING" },
          data: { status: "PAID" },
        });
        if (result.count > 0) {
          // Premier passage en PAID → email de confirmation. Idempotent par garde "PENDING".
          const order = await prisma.order.findUnique({
            where: { number: orderNumber },
            select: {
              total: true,
              guestEmail: true,
              shippingAddress: true,
              user: { select: { email: true, firstName: true, lastName: true } },
            },
          });
          if (order) {
            const email = order.user?.email ?? order.guestEmail ?? session.customer_email ?? null;
            const customerName =
              [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") ||
              extractName(order.shippingAddress);
            if (email) {
              const tpl = tplOrderConfirmation({
                customerName,
                number: orderNumber,
                total: formatPrice(order.total),
              });
              await sendEmail({
                to: email,
                toName: customerName,
                subject: tpl.subject,
                html: tpl.html,
              });
            }
          }
        }
      }
    } else if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object;
      const orderNumber = session.metadata?.orderNumber;
      if (orderNumber) {
        await cancelPendingOrderByNumber(orderNumber);
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return new Response("handler error", { status: 500 });
  }

  return Response.json({ received: true });
}

function extractName(rawAddress: string): string {
  try {
    const v = JSON.parse(rawAddress);
    return typeof v?.fullName === "string" ? v.fullName : "";
  } catch {
    return "";
  }
}

async function cancelPendingOrderByNumber(orderNumber: string) {
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
    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  });
}
