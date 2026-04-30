import { CatalogPage } from "@/components/boutique/catalog-page";

export const metadata = {
  title: "Boutique",
  description: "Smartphones, tablettes, ordinateurs et accessoires reconditionnés et d'occasion",
};
export const revalidate = 60;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function BoutiqueIndex({ searchParams }: Props) {
  return (
    <CatalogPage
      title="Toute la boutique"
      description="Smartphones, tablettes, ordinateurs et accessoires — reconditionnés et d'occasion, toutes marques."
      basePath="/boutique"
      searchParams={searchParams}
    />
  );
}
