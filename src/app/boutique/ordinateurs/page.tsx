import { CatalogPage } from "@/components/boutique/catalog-page";

export const metadata = {
  title: "Ordinateurs",
  description: "MacBook, ordinateurs portables Windows reconditionnés et d'occasion",
};
export const revalidate = 60;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function OrdinateursPage({ searchParams }: Props) {
  return (
    <CatalogPage
      title="Ordinateurs"
      description="MacBook, ordinateurs portables Windows et autres — reconditionnés et d'occasion, garantis."
      filter={{ category: "ORDINATEUR_PORTABLE" }}
      basePath="/boutique/ordinateurs"
      searchParams={searchParams}
    />
  );
}
