import Link from "next/link";
import { Phone, Mail, Clock } from "lucide-react";
import { getStoreSettings } from "@/lib/store-settings";

export async function TopBar() {
  const store = await getStoreSettings();
  return (
    <div className="hidden md:block bg-black text-foreground/70 text-xs border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-primary" /> {store.phone}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-primary" /> {store.email}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" /> {store.hours}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/reparations/suivi" className="hover:text-primary transition">
            Suivre ma réparation
          </Link>
          <span className="text-border-strong">|</span>
          <Link href="/reclamations" className="hover:text-primary transition">
            Réclamations
          </Link>
          <span className="text-border-strong">|</span>
          <Link href="/temoignages" className="hover:text-primary transition">
            Témoignages
          </Link>
          <span className="text-border-strong">|</span>
          <Link href="/contact" className="hover:text-primary transition">
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
