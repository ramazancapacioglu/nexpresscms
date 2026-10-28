"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { MarketplaceDriverMeta } from "@nexpress/marketplace";
import type { MarketplaceChannelDto } from "@nexpress/database";
import { saveMarketplaceChannelAction } from "@/app/admin/commerce/marketplace-actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

export function MarketplaceStudio({
  drivers,
  channels,
}: {
  drivers: MarketplaceDriverMeta[];
  channels: Array<Omit<MarketplaceChannelDto, "credentials"> & { credentialKeys: string[] }>;
}) {
  const router = useRouter();
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [pending, start] = useTransition();
  const driver = drivers.find((item) => item.id === driverId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[18px] font-semibold">Pazar yerleri</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Her kanal ayrı bir mağaza hesabıdır. Yeni pazar yeri, sürücü kaydıyla eklenir; çekirdek ekran değişmez.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {drivers.map((item) => (
          <article key={item.id} className="rounded-lg border border-[#E6E7EA] p-3 dark:border-[#23262E]">
            <h2 className="text-[13px] font-semibold">{item.name}</h2>
            <p className="mt-1 text-[11px] leading-5 text-[#5F6570] dark:text-[#8C9099]">{item.summary}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
        <h2 className="mb-3 text-[13px] font-semibold">Kanal ekle</h2>
        <div className="grid max-w-lg gap-3">
          <label className="block space-y-1">
            <span className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Pazar yeri</span>
            <select className={fieldClass} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              {drivers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Kanal adı</span>
            <input
              className={fieldClass}
              value={label}
              placeholder={driver ? `${driver.name} mağazası` : ""}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={pending || !driverId}
            className="w-fit rounded-md bg-[#111318] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50 dark:bg-white dark:text-[#111318]"
            onClick={() =>
              start(async () => {
                const id = await saveMarketplaceChannelAction({
                  driverId,
                  label: label || driver?.name || driverId,
                  enabled: true,
                  environment: "sandbox",
                  credentials: {},
                });
                router.push(`/admin/commerce/marketplaces/${id}`);
              })
            }
          >
            Kanal oluştur
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold">Bağlı kanallar</h2>
        {channels.length === 0 ? (
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Henüz kanal yok.</p>
        ) : (
          <ul className="divide-y divide-[#E6E7EA] rounded-lg border border-[#E6E7EA] dark:divide-[#23262E] dark:border-[#23262E]">
            {channels.map((channel) => (
              <li key={channel.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[12px]">
                <div>
                  <Link href={`/admin/commerce/marketplaces/${channel.id}`} className="font-medium hover:underline">
                    {channel.label}
                  </Link>
                  <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                    {channel.driverId} · {channel.environment} · {channel.connectionStatus}
                  </p>
                </div>
                <span className={channel.enabled ? "text-emerald-800 dark:text-emerald-400" : "text-[#5F6570] dark:text-[#8C9099]"}>
                  {channel.enabled ? "Açık" : "Kapalı"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
