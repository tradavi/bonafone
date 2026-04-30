"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartCount } from "@/lib/cart-store";

export function CartCounter() {
  // Évite l'hydration mismatch : on n'affiche le compteur qu'après le mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = useCartCount();

  return (
    <Link
      href="/panier"
      className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-surface hover:text-primary transition relative"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-[10px] hidden md:block">Panier</span>
      <span
        className={`absolute top-0 right-0 bg-primary text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-0.5 grid place-items-center shadow-[0_0_8px_var(--primary-glow)] transition-opacity ${
          mounted && count > 0 ? "opacity-100" : "opacity-0"
        }`}
      >
        {mounted ? count : 0}
      </span>
    </Link>
  );
}
