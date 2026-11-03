import type { Metadata } from "next";
import { TaxonomyIndex, taxonomyIndexMetadata } from "@/components/public/taxonomy-index";

type Params = Promise<{ locale: string }>;

export const generateMetadata = ({ params }: { params: Params }): Promise<Metadata> => taxonomyIndexMetadata("category", params);

export default function Page({ params }: { params: Params }) {
  return <TaxonomyIndex kind="category" params={params} />;
}
