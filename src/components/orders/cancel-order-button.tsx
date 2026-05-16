"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cancelOwnPendingOrder } from "@/lib/actions/checkout";

type Props = {
  orderNumber: string;
};

export function CancelOrderButton({ orderNumber }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await cancelOwnPendingOrder(orderNumber);
      if (!res.ok) {
        setError(res.error ?? "Une erreur est survenue.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border hover:border-red-500/50 hover:text-red-400 rounded-lg text-sm font-semibold transition"
      >
        <X className="h-4 w-4" />
        Annuler la commande
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 grid place-items-center rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2
                  id="cancel-order-title"
                  className="text-lg font-extrabold tracking-tight"
                >
                  Annuler la commande&nbsp;?
                </h2>
                <p className="text-sm text-foreground-muted mt-1">
                  Cette action remet les articles en stock et passe la commande
                  en{" "}
                  <span className="font-semibold text-foreground">Annulée</span>.
                  Elle est définitive.
                </p>
              </div>
            </div>

            <div className="font-mono text-xs text-primary mb-4 px-3 py-2 bg-surface-2 border border-border rounded-lg inline-block">
              {orderNumber}
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border hover:border-foreground-muted rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                Garder ma commande
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Annulation…" : "Oui, annuler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
