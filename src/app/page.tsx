export const revalidate = 60;

import { Hero } from "@/components/home/hero";
import { Categories } from "@/components/home/categories";
import { FeaturedProducts } from "@/components/home/featured-products";
import { RepairCTA } from "@/components/home/repair-cta";
import { Testimonials } from "@/components/home/testimonials";
import { Brands } from "@/components/home/brands";
import { ContactSnippet } from "@/components/home/contact-snippet";
import { Newsletter } from "@/components/home/newsletter";
import { JsonLd, localBusinessSchema } from "@/components/seo/json-ld";

export default function Home() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <Hero />
      <Categories />
      <FeaturedProducts />
      <RepairCTA />
      <Testimonials />
      <Brands />
      <ContactSnippet />
      <Newsletter />
    </>
  );
}
