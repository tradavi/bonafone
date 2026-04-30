import { auth } from "@/auth";
import { getProductByBarcode } from "@/lib/queries";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("forbidden", { status: 403 });
  }
  const url = new URL(request.url);
  const barcode = url.searchParams.get("barcode") ?? "";
  const product = await getProductByBarcode(barcode);
  if (!product) {
    return Response.json({ found: false });
  }
  return Response.json({
    found: true,
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand.name,
      category: product.category,
      condition: product.condition,
      stock: product.stock,
      price: product.price,
      isActive: product.isActive,
    },
  });
}
