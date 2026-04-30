"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type Props = {
  product: Omit<CartItem, "quantity">;
  variant?: "icon" | "full";
  className?: string;
};

export function AddToCartButton({ product, variant = "icon", className }: Props) {
  const addItem = useCart((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = () => {
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const outOfStock = product.stock !== undefined && product.stock <= 0;

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label="Ajouter au panier"
        onClick={handleClick}
        disabled={outOfStock}
        className={cn(
          "h-9 w-9 grid place-items-center rounded-lg text-white transition shadow-[0_0_16px_var(--primary-glow)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
          justAdded
            ? "bg-emerald-500 shadow-emerald-500/30"
            : "bg-primary hover:bg-primary-strong",
          className,
        )}
      >
        {justAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={outOfStock}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-6 py-4 text-white rounded-lg font-bold transition shadow-[0_0_32px_var(--primary-glow)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none",
        justAdded
          ? "bg-emerald-500 shadow-emerald-500/30"
          : "bg-primary hover:bg-primary-strong",
        className,
      )}
    >
      {justAdded ? (
        <>
          <Check className="h-5 w-5" />
          Ajouté au panier
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          {outOfStock ? "Rupture de stock" : "Ajouter au panier"}
        </>
      )}
    </button>
  );
}
