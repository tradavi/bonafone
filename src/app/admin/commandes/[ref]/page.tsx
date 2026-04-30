import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save, Mail, Phone, MapPin, Package, User } from "lucide-react";
import { getAdminOrderByNumber } from "@/lib/queries";
import { formatPrice } from "@/lib/utils";
import { updateOrderStatus, updateOrderTracking } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ ref: string }> };

export async function generateMetadata({ params }: Props) {
  const { ref } = await params;
  return { title: ref };
}

const STATUSES = [
  { code: "PENDING", label: "En attente" },
  { code: "PAID", label: "Payée" },
  { code: "PREPARING", label: "Préparation" },
  { code: "SHIPPED", label: "Expédiée" },
  { code: "DELIVERED", label: "Livrée" },
  { code: "CANCELLED", label: "Annulée" },
  { code: "REFUNDED", label: "Remboursée" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PAID: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PREPARING: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  SHIPPED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DELIVERED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  CANCELLED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  REFUNDED: "bg-primary/10 text-primary border-primary/30",
};

type Address = {
  fullName?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
};

function parseAddress(raw: string | null): Address | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { ref } = await params;
  const order = await getAdminOrderByNumber(ref);
  if (!order) notFound();
  const address = parseAddress(order.shippingAddress);
  const customerEmail = order.user?.email ?? order.guestEmail;
  const customerName =
    `${order.user?.firstName ?? ""} ${order.user?.lastName ?? ""}`.trim() ||
    address?.fullName ||
    "Invité";

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-2xl p-6">
        <Link
          href="/admin/commandes"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux commandes
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-foreground-muted">
              Commande <span className="font-mono text-primary">{order.number}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {formatPrice(order.total)}
            </h1>
            <div className="text-sm text-foreground-muted mt-1">
              {order.createdAt.toLocaleString("fr-FR")} · {order.paymentMethod}
            </div>
          </div>
          <span
            className={`px-3 py-1.5 text-sm font-bold rounded-full border ${
              STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING
            }`}
          >
            {STATUSES.find((s) => s.code === order.status)?.label ?? order.status}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card title="Articles" icon={Package}>
            <div className="space-y-3">
              {order.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3 p-3 bg-surface-2 border border-border rounded-lg"
                >
                  {it.product.primaryImage ? (
                    <img
                      src={it.product.primaryImage}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-surface border border-border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/produit/${it.product.slug}`}
                      target="_blank"
                      className="font-medium hover:text-primary truncate block"
                    >
                      {it.product.name}
                    </Link>
                    <div className="text-xs text-foreground-muted">
                      {it.product.brand.name} · {it.quantity} × {formatPrice(it.unitPrice)}
                    </div>
                  </div>
                  <div className="font-semibold">{formatPrice(it.total)}</div>
                </div>
              ))}
            </div>
            <dl className="mt-5 pt-4 border-t border-border space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-foreground-muted">Sous-total</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-muted">Livraison</dt>
                <dd>{order.shippingCost === 0 ? "Offerte" : formatPrice(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-border">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Statut">
            <form action={updateOrderStatus} className="flex items-end gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <label className="flex-1 block">
                <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">
                  Nouveau statut
                </span>
                <select name="status" defaultValue={order.status} className={inputCls}>
                  {STATUSES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition shadow-[0_0_16px_var(--primary-glow)]"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </form>
          </Card>

          <Card title="Suivi de livraison">
            <form action={updateOrderTracking} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <div className="grid md:grid-cols-2 gap-3">
                <Input label="Transporteur" name="carrier" defaultValue={order.carrier ?? ""} />
                <Input
                  label="N° de suivi"
                  name="trackingNumber"
                  defaultValue={order.trackingNumber ?? ""}
                />
              </div>
              <Textarea label="Notes (interne)" name="notes" defaultValue={order.notes ?? ""} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-border hover:border-primary rounded-lg text-sm font-semibold transition"
              >
                <Save className="h-4 w-4" />
                Mettre à jour
              </button>
            </form>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Client" icon={User}>
            <dl className="space-y-3 text-sm">
              <Row label="Nom" value={customerName} />
              <Row label="Email" value={customerEmail} icon={Mail} />
              {(order.user?.phone ?? address?.phone) && (
                <Row label="Téléphone" value={order.user?.phone ?? address?.phone ?? ""} icon={Phone} />
              )}
              <Row label="Mode" value={order.user ? "Compte client" : "Invité"} />
            </dl>
          </Card>

          {address && (
            <Card title="Adresse de livraison" icon={MapPin}>
              <div className="text-sm leading-relaxed">
                <div className="font-medium">{address.fullName}</div>
                <div className="text-foreground-muted">{address.line1}</div>
                {address.line2 && <div className="text-foreground-muted">{address.line2}</div>}
                <div className="text-foreground-muted">
                  {address.postalCode} {address.city}
                </div>
                <div className="text-foreground-muted">{address.country}</div>
                {address.phone && (
                  <div className="text-foreground-muted mt-1">{address.phone}</div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary placeholder:text-foreground-subtle";

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h2 className="font-extrabold tracking-tight mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {title}
      </h2>
      {children}
    </div>
  );
}
function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="font-medium flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-foreground-muted" />}
        {value ?? "—"}
      </dd>
    </div>
  );
}
function Input({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">{label}</span>
      <input name={name} defaultValue={defaultValue} className={inputCls} />
    </label>
  );
}
function Textarea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-foreground-muted font-semibold mb-1.5 block">{label}</span>
      <textarea name={name} rows={3} defaultValue={defaultValue} className={inputCls} />
    </label>
  );
}
