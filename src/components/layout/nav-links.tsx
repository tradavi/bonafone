"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Smartphones", href: "/boutique/smartphones" },
  { label: "Tablettes", href: "/boutique/tablettes" },
  { label: "Ordinateurs", href: "/boutique/ordinateurs" },
  { label: "Accessoires", href: "/boutique/accessoires" },
  { label: "Réparations", href: "/reparations", icon: Wrench },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-3 -mx-1 px-1">
      {NAV.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md transition",
              isActive
                ? "bg-primary text-white shadow-[0_0_16px_var(--primary-glow)]"
                : "text-foreground/70 hover:text-foreground hover:bg-surface",
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
