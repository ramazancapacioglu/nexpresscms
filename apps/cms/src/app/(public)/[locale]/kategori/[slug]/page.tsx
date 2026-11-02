import type { Metadata } from "next";
import { archiveMetadata, TaxonomyArchive } from "@/components/public/taxonomy-archive";

type Params = Promise<{ locale: string; slug: string }>;

export const generateMetadata = ({ params }: { params: Params }): Promise<Metadata> => archiveMetadata("category", params);

export default function Page({ params }: { params: Params }) {
  return <TaxonomyArchive kind="category" params={params} />;
}
