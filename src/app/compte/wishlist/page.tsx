export const metadata = { title: "Mes favoris" };

export default function WishlistPage() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-10 text-center">
      <h1 className="text-2xl font-extrabold mb-2 tracking-tight">Mes favoris</h1>
      <p className="text-foreground-muted">
        Ajoutez des produits à votre wishlist depuis la boutique.
      </p>
    </div>
  );
}
