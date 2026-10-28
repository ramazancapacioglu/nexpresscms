import React from "react";
import { Link } from "@/components/public/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCommerceRepository } from "@nexpress/database";
import { shopBasePath } from "@/lib/commerce/shop-paths";

export const dynamic = "force-dynamic";

export default async function ShopThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ no?: string }>;
}) {
  const { locale } = await params;
  const { no } = await searchParams;
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const settings = await getCommerceRepository(siteId).getCommerceSettings();
  if (!settings.enabled) notFound();

  const base = shopBasePath(settings, locale);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Teşekkürler</h1>
      <p className="mt-3 text-sm text-neutral-500">
        Siparişiniz alındı
        {no ? (
          <>
            {" "}
            — referans: <strong>{no}</strong>
          </>
        ) : null}
        .
      </p>
      <Link href={base} className="mt-8 inline-block text-sm underline">
        Mağazaya dön
      </Link>
    </div>
  );
}
