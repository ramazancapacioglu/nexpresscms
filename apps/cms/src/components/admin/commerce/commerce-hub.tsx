"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CommerceOrderDto, CommerceProductDto, CommerceSettings } from "@nexpress/commerce";
import { formatMoney } from "@nexpress/commerce";
import { saveCommerceSettingsAction } from "@/app/admin/commerce/actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

export function CommerceHub({
  settings,
  products,
  orders,
  shopPublicPath,
}: {
  settings: CommerceSettings;
  products: CommerceProductDto[];
  orders: CommerceOrderDto[];
  shopPublicPath: string;
}) {
  const router = useRouter();
  const [cfg, setCfg] = useState(settings);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const published = products.filter((p) => p.status === "published").length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.totalCents, 0);

  const save = () => {
    start(async () => {
      await saveCommerceSettingsAction({
        ...cfg,
        flatShippingCents: Math.round(Number(cfg.flatShippingCents) || 0),
        freeShippingThresholdCents: Math.round(Number(cfg.freeShippingThresholdCents) || 0),
      });
      setNotice("Mağaza ayarları kaydedildi.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <div>
          <h1 className="text-[18px] font-semibold">E-Ticaret</h1>
          <p className="text-[12px] text-[#8C9099]">
            Ürün kataloğu, siparişler ve mağaza ayarları. Ön yüz:{" "}
            <Link href={shopPublicPath} className="underline">
              {shopPublicPath}
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/commerce/products"
            className="rounded-md border border-[#E6E7EA] px-3 py-2 text-[12px] dark:border-[#23262E]"
          >
            Ürünler
          </Link>
          <Link
            href="/admin/commerce/orders"
            className="rounded-md border border-[#E6E7EA] px-3 py-2 text-[12px] dark:border-[#23262E]"
          >
            Siparişler
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Yayındaki ürün" value={String(published)} />
        <Metric label="Bekleyen sipariş" value={String(pendingOrders)} />
        <Metric label="Toplam ciro" value={formatMoney(revenue, cfg.currency)} />
      </div>

      <section className="rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
        <h2 className="mb-3 text-[13px] font-semibold">Mağaza ayarları</h2>
        <div className="grid max-w-xl gap-3">
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={cfg.enabled}
              onChange={(e) => setCfg((c) => ({ ...c, enabled: e.target.checked }))}
            />
            Mağaza açık
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-[#8C9099]">Mağaza yolu (slug)</span>
            <input
              className={fieldClass}
              value={cfg.shopBasePath}
              onChange={(e) => setCfg((c) => ({ ...c, shopBasePath: e.target.value }))}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-[#8C9099]">Sabit kargo (kuruş)</span>
              <input
                className={fieldClass}
                type="number"
                value={cfg.flatShippingCents}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, flatShippingCents: Number(e.target.value) }))
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-[#8C9099]">Ücretsiz kargo eşiği (kuruş)</span>
              <input
                className={fieldClass}
                type="number"
                value={cfg.freeShippingThresholdCents}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, freeShippingThresholdCents: Number(e.target.value) }))
                }
              />
            </label>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="w-fit rounded-md bg-[#111318] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50 dark:bg-white dark:text-[#111318]"
          >
            Ayarları kaydet
          </button>
          {notice ? <p className="text-[12px] text-emerald-600">{notice}</p> : null}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
      <p className="text-[11px] text-[#8C9099]">{label}</p>
      <p className="text-[20px] font-semibold">{value}</p>
    </div>
  );
}
