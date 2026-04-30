export const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PAID: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PREPARING: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  SHIPPED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DELIVERED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  CANCELLED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  REFUNDED: "bg-primary/10 text-primary border-primary/30",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payée",
  PREPARING: "Préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};
