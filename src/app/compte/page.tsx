import Link from "next/link";
import { ShoppingBag, Wrench, Star, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Mon compte" };
export const dynamic = "force-dynamic";

export default async function ComptePage() {
  const session = await auth();
  // Le middleware nous garantit déjà session?.user mais TypeScript ne le sait pas.
  if (!session?.user) return null;

  const userId = session.user.id;
  const [ordersCount, repairsCount, loyalty] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.repair.count({ where: { userId } }),
    prisma.loyaltyAccount.findUnique({ where: { userId } }),
  ]);

  const firstName =
    session.user.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "vous";

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-40 w-40 bg-primary/15 blur-3xl rounded-full" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-1 tracking-tight">
            Bonjour {firstName} 👋
          </h1>
          <p className="text-foreground-muted">
            Bienvenue dans votre espace Bonafone.
          </p>
          {session.user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm font-semibold hover:bg-primary hover:text-white transition"
            >
              <ShieldCheck className="h-4 w-4" />
              Accéder au back-office
            </Link>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            icon: ShoppingBag,
            title: "Commandes",
            value: ordersCount.toString(),
            href: "/compte/commandes",
          },
          {
            icon: Wrench,
            title: "Réparations en cours",
            value: repairsCount.toString(),
            href: "/compte/reparations",
          },
          {
            icon: Star,
            title: "Points fidélité",
            value: (loyalty?.points ?? 0).toString(),
            href: "/compte",
          },
        ].map(({ icon: Icon, title, value, href }) => (
          <Link
            key={title}
            href={href}
            className="bg-surface border border-border rounded-2xl p-6 hover:border-primary transition"
          >
            <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary mb-4">
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-sm text-foreground-muted">{title}</div>
            <div className="text-2xl font-extrabold mt-1">{value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
