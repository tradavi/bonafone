import Link from "next/link";
import { Search, Heart } from "lucide-react";
import { LogoFull } from "@/components/ui/logo";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { HideOnHome } from "./hide-on-home";
import { CartCounter } from "@/components/cart/cart-counter";
import { auth } from "@/auth";

export async function Header() {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null;

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-6 py-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 transition hover:opacity-90">
            <LogoFull />
          </Link>

          {/* Search — caché sur la home (page service réparation) */}
          <HideOnHome>
            <div className="hidden md:flex flex-1 max-w-2xl">
              <form action="/boutique" className="flex w-full" role="search">
                <input
                  name="q"
                  type="search"
                  placeholder="Rechercher un smartphone, accessoire..."
                  className="flex-1 px-4 py-2.5 text-sm bg-surface border border-border rounded-l-lg focus:outline-none focus:border-primary placeholder:text-foreground-subtle"
                />
                <button
                  type="submit"
                  className="px-5 bg-primary hover:bg-primary-strong text-white rounded-r-lg flex items-center gap-2 text-sm font-semibold transition shadow-[0_0_20px_var(--primary-glow)]"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden lg:inline">Rechercher</span>
                </button>
              </form>
            </div>
          </HideOnHome>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2 ml-auto">
            <UserMenu user={user} />
            {/* Favoris + panier cachés sur la home (page service réparation) */}
            <HideOnHome>
              <Link
                href="/compte/wishlist"
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-surface hover:text-primary transition"
              >
                <Heart className="h-5 w-5" />
                <span className="text-[10px] hidden md:block">Favoris</span>
              </Link>
              <CartCounter />
            </HideOnHome>
          </div>
        </div>

        {/* Nav — cachée sur la home */}
        <HideOnHome>
          <NavLinks />
        </HideOnHome>
      </div>
    </header>
  );
}
