import type { Metadata } from "next";
import { archiveMetadata, TaxonomyArchive } from "@/components/public/taxonomy-archive";

type Params = Promise<{ locale: string; slug: string }>;
type Search = Promise<{ sayfa?: string }>;

export const generateMetadata = ({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> => archiveMetadata("category", params, searchParams);

export default function Page({ params, searchParams }: { params: Params; searchParams: Search }) {
  return <TaxonomyArchive kind="category" params={params} searchParams={searchParams} />;
}
