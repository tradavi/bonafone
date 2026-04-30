import { CatalogPage } from "@/components/boutique/catalog-page";

export const metadata = {
  title: "Accessoires",
  description: "Coques, chargeurs, câbles, écouteurs, protections écran",
};
export const revalidate = 60;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function AccessoiresPage({ searchParams }: Props) {
  return (
    <CatalogPage
      title="Accessoires"
      description="Coques, chargeurs, câbles, écouteurs, protections d'écran et plus."
      filter={{ category: "ACCESSOIRE" }}
      basePath="/boutique/accessoires"
      searchParams={searchParams}
    />
  );
}
