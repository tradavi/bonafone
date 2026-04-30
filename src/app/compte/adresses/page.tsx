export const metadata = { title: "Mes adresses" };

export default function AdressesPage() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-10 text-center">
      <h1 className="text-2xl font-extrabold mb-2 tracking-tight">Mes adresses</h1>
      <p className="text-foreground-muted">
        Aucune adresse enregistrée. Ajoutez-en une lors de votre première commande.
      </p>
    </div>
  );
}
