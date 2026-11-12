import type { Metadata } from "next";
import ContentPage, { generateMetadata as contentMetadata } from "../page";

/**
 * Önekli kayıt adresi: `/{dil}/{arşiv-adresi}/{kayıt}` (ör. `/referanslar/acme`). Sayfa mantığı `[slug]` ile ortaktır;
 * ilk parça `prefix`, ikincisi kayıt `slug`'ı olarak aktarılır. Önek, kayıtları önekli açık bir özel türün arşiv adresi
 * değilse 404 döner. (Aynı düzeyde dinamik klasör adı `slug` kalmalıdır; bu yüzden iç içe `[slug]/[child]`.)
 * `kategori`, `etiket`, `magaza`, `kampanya`, `yazar` gibi sabit klasörler bu dinamik klasörden önce eşleşir.
 */
type Params = Promise<{ locale: string; slug: string; child: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const remap = async (params: Params) => {
  const p = await params;
  return { locale: p.locale, prefix: p.slug, slug: p.child };
};

export const generateMetadata = ({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> =>
  contentMetadata({ params: remap(params), searchParams });

export default function PrefixedContentPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  return ContentPage({ params: remap(params), searchParams: searchParams as never });
}
