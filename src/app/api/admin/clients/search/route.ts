import { auth } from "@/auth";
import { searchClients } from "@/lib/queries";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("forbidden", { status: 403 });
  }
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const results = await searchClients(q);
  return Response.json(results);
}
