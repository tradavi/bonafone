import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminNotifications } from "@/lib/queries";

// Pas de cache : ce endpoint est polled toutes les 30s, on veut toujours les
// données fraîches. force-dynamic empêche aussi Vercel de cacher la réponse.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getAdminNotifications({ recentLimit: 10 });
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
