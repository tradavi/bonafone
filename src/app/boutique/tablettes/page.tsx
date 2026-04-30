import { CatalogPage } from "@/components/boutique/catalog-page";

export const metadata = {
  title: "Tablettes",
  description: "iPad, Galaxy Tab et autres tablettes reconditionnées et d'occasion",
};
export const revalidate = 60;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function TablettesPage({ searchParams }: Props) {
  return (
    <CatalogPage
      title="Tablettes"
      description="iPad, Galaxy Tab et autres tablettes — reconditionnées et d'occasion, vérifiées et garanties."
      filter={{ category: "TABLETTE" }}
      basePath="/boutique/tablettes"
      searchParams={searchParams}
    />
  );
}
