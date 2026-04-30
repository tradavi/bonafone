"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, ShoppingBag, Wrench, ShieldCheck, ChevronDown } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role: string;
};

export function UserMenu({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/connexion"
        className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-surface hover:text-primary transition"
      >
        <User className="h-5 w-5" />
        <span className="text-[10px] hidden md:block">Connexion</span>
      </Link>
    );
  }

  const displayName = user.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Vous";
  const isAdmin = user.role === "ADMIN";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-surface transition"
      >
        <div className="grid place-items-center h-7 w-7 rounded-full bg-primary text-white text-xs font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium hidden md:inline">{displayName}</span>
        <ChevronDown className="h-3.5 w-3.5 hidden md:inline text-foreground-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <div className="font-semibold text-sm truncate">{user.name ?? "Mon compte"}</div>
            <div className="text-xs text-foreground-muted truncate">{user.email}</div>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded text-[10px] font-bold">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </span>
            )}
          </div>
          <div className="py-1">
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2 transition text-primary"
                  onClick={() => setOpen(false)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Back-office
                </Link>
                <Link
                  href="/compte/profil"
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2 transition"
                  onClick={() => setOpen(false)}
                >
                  <User className="h-4 w-4 text-foreground-muted" />
                  Mon profil
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/compte"
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2 transition"
                  onClick={() => setOpen(false)}
                >
                  <User className="h-4 w-4 text-foreground-muted" />
                  Mon compte
                </Link>
                <Link
                  href="/compte/commandes"
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2 transition"
                  onClick={() => setOpen(false)}
                >
                  <ShoppingBag className="h-4 w-4 text-foreground-muted" />
                  Mes commandes
                </Link>
                <Link
                  href="/compte/reparations"
                  className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2 transition"
                  onClick={() => setOpen(false)}
                >
                  <Wrench className="h-4 w-4 text-foreground-muted" />
                  Mes réparations
                </Link>
              </>
            )}
          </div>
          <form action={signOutAction} className="border-t border-border">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground-muted hover:bg-primary/10 hover:text-primary transition"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
