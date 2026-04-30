import { auth } from "@/auth";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata = { title: "Commande" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await auth();
  return (
    <CheckoutView
      defaultEmail={session?.user?.email ?? ""}
      defaultName={session?.user?.name ?? ""}
      isAuthenticated={Boolean(session?.user)}
    />
  );
}
