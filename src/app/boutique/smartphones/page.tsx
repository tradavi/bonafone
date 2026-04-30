import { CatalogPage } from "@/components/boutique/catalog-page";

export const metadata = {
  title: "Smartphones",
  description: "iPhone, Samsung, Xiaomi, Google Pixel — reconditionnés et d'occasion, garantis",
};
export const revalidate = 60;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function SmartphonesPage({ searchParams }: Props) {
  return (
    <CatalogPage
      title="Smartphones"
      description="iPhone, Samsung Galaxy, Xiaomi, Google Pixel — reconditionnés et d'occasion, vérifiés et garantis."
      filter={{ category: "SMARTPHONE" }}
      basePath="/boutique/smartphones"
      searchParams={searchParams}
    />
  );
}
