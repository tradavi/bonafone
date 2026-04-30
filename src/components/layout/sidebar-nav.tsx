"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SidebarItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

export function SidebarNav({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5">
      {items.map(({ href, label, icon, badge }) => {
        // Pour le tableau de bord (`/admin` ou `/compte`), match exact uniquement,
        // sinon `/admin/produits` matche aussi `/admin`.
        const isActive =
          pathname === href ||
          (href !== "/admin" && href !== "/compte" && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition border",
              isActive
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-foreground-muted hover:bg-surface-2 hover:text-foreground border-transparent",
            )}
          >
            {icon}
            <span className="flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
