"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine, CheckCircle2, ArrowRight, Loader2, X } from "lucide-react";

type LookupHit =
  | { found: false }
  | {
      found: true;
      product: {
        id: string;
        slug: string;
        name: string;
        brand: string;
        category: string;
        condition: string;
        stock: number;
        price: number;
        isActive: boolean;
      };
    };

/**
 * Bandeau "scanner ou saisir un code-barres" affiché en tête de la page
 * /admin/produits/nouveau. Si le code correspond à un produit déjà en DB,
 * on propose d'aller directement éditer la fiche existante (évite les doublons).
 */
export function BarcodeScanBanner() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "miss" | "hit">("idle");
  const [hit, setHit] = useState<Extract<LookupHit, { found: true }>["product"] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function lookup(value: string) {
    const v = value.trim();
    if (!v) {
      setState("idle");
      setHit(null);
      return;
    }
    setState("loading");
    try {
      const res = await fetch(
        `/api/admin/products/lookup?barcode=${encodeURIComponent(v)}`,
      );
      if (!res.ok) {
        setState("idle");
        return;
      }
      const data = (await res.json()) as LookupHit;
      if (data.found) {
        setHit(data.product);
        setState("hit");
      } else {
        setHit(null);
        setState("miss");
      }
    } catch {
      setState("idle");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    lookup(code);
  }

  function clear() {
    setCode("");
    setState("idle");
    setHit(null);
    inputRef.current?.focus();
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <ScanLine className="h-5 w-5 text-primary" />
        <h2 className="font-extrabold tracking-tight">Scanner / saisir un code-barres</h2>
      </div>
      <p className="text-xs text-foreground-muted mb-3">
        Si le produit existe déjà, vous serez redirigé vers sa fiche. Sinon vous pouvez le créer
        en remplissant le formulaire — le code sera enregistré avec le produit.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (state !== "idle") setState("idle");
          }}
          placeholder="EAN13 / UPC / Code 128…"
          className="flex-1 px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary placeholder:text-foreground-subtle"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={state === "loading" || !code.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Recherche…
            </>
          ) : (
            <>
              <ScanLine className="h-4 w-4" />
              Rechercher
            </>
          )}
        </button>
        {state !== "idle" && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-surface-2 border border-border hover:border-primary transition"
            aria-label="Effacer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {state === "hit" && hit && (
        <div className="mt-3 flex items-center justify-between gap-3 p-3 bg-emerald-500/5 border border-emerald-500/30 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 grid place-items-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">{hit.name}</div>
              <div className="text-xs text-foreground-muted">
                {hit.brand} · {hit.condition.toLowerCase()} · stock {hit.stock}
                {!hit.isActive && " · archivé"}
              </div>
            </div>
          </div>
          <a
            href={`/admin/produits/${hit.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-strong text-white rounded-lg text-xs font-semibold transition"
          >
            Modifier
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {state === "miss" && (
        <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/30 rounded-xl text-sm">
          <div className="font-semibold mb-0.5">Code inconnu — produit à créer</div>
          <div className="text-xs text-foreground-muted">
            Remplissez le formulaire ci-dessous, le code <span className="font-mono">{code}</span>{" "}
            sera attribué au nouveau produit.
            <CarryCodeIntoForm code={code} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Effet de bord : recopie le code-barres saisi dans l'input du formulaire
 * principal (Section "Prix & stock", champ name="barcode") afin qu'il soit
 * soumis avec le reste sans nécessité de le retaper.
 */
function CarryCodeIntoForm({ code }: { code: string }) {
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>('input[name="barcode"]');
    if (input && !input.value) input.value = code;
  }, [code]);
  return null;
}
