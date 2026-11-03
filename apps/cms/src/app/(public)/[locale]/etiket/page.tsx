import type { Metadata } from "next";
import { TaxonomyIndex, taxonomyIndexMetadata } from "@/components/public/taxonomy-index";

type Params = Promise<{ locale: string }>;

export const generateMetadata = ({ params }: { params: Params }): Promise<Metadata> => taxonomyIndexMetadata("tag", params);

export default function Page({ params }: { params: Params }) {
  return <TaxonomyIndex kind="tag" params={params} />;
}
