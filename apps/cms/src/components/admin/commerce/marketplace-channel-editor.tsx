"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { MarketplaceDriverMeta, MarketplaceEnvironment } from "@nexpress/marketplace";
import type { MarketplaceChannelDto, MarketplaceInboundOrderDto, MarketplaceJobDto } from "@nexpress/database";
import { formatMoney } from "@nexpress/commerce";
import {
  deleteMarketplaceChannelAction,
  pullMarketplaceOrdersAction,
  pushMarketplaceStockAction,
  saveMarketplaceChannelAction,
  testMarketplaceChannelAction,
} from "@/app/admin/commerce/marketplace-actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

export function MarketplaceChannelEditor({
  channel,
  driver,
  jobs,
  orders,
}: {
  channel: MarketplaceChannelDto;
  driver: MarketplaceDriverMeta;
  jobs: MarketplaceJobDto[];
  orders: MarketplaceInboundOrderDto[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState(channel.label);
  const [enabled, setEnabled] = useState(channel.enabled);
  const [environment, setEnvironment] = useState<MarketplaceEnvironment>(channel.environment);
  const [credentials, setCredentials] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const field of driver.credentialFields) {
      next[field.key] = field.secret ? "" : (channel.credentials[field.key] ?? "");
    }
    return next;
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (task: () => Promise<string>) => {
    start(async () => {
      const message = await task();
      setNotice(message);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-[18px] font-semibold">{driver.name}</h1>
        <p className="text-[12px] text-[#8C9099]">{driver.summary}</p>
        <a href={driver.docsUrl} className="text-[11px] underline" target="_blank" rel="noreferrer">
          Resmi dokümantasyon
        </a>
      </header>

      <section className="grid gap-3">
        <label className="block space-y-1">
          <span className="text-[11px] text-[#8C9099]">Kanal adı</span>
          <input className={fieldClass} value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-[12px]">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Kanal açık
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-[#8C9099]">Ortam</span>
          <select
            className={fieldClass}
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as MarketplaceEnvironment)}
          >
            <option value="sandbox">Test</option>
            <option value="production">Canlı</option>
          </select>
        </label>
        {driver.credentialFields.map((field) => (
          <label key={field.key} className="block space-y-1">
            <span className="text-[11px] text-[#8C9099]">
              {field.label}
              {field.secret && channel.credentials[field.key] ? " (kayıtlı, boş bırakılırsa korunur)" : ""}
            </span>
            <input
              className={fieldClass}
              type={field.secret ? "password" : "text"}
              placeholder={field.placeholder}
              value={credentials[field.key] ?? ""}
              onChange={(e) => setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))}
            />
            {field.help ? <span className="block text-[11px] text-[#8C9099]">{field.help}</span> : null}
          </label>
        ))}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className="rounded-md bg-[#111318] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50 dark:bg-white dark:text-[#111318]"
            onClick={() =>
              run(async () => {
                await saveMarketplaceChannelAction({
                  id: channel.id,
                  driverId: channel.driverId,
                  label,
                  enabled,
                  environment,
                  credentials,
                });
                return "Kanal kaydedildi.";
              })
            }
          >
            Kaydet
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-md border border-[#E6E7EA] px-4 py-2 text-[12px] dark:border-[#23262E]"
            onClick={() => run(() => testMarketplaceChannelAction(channel.id))}
          >
            Bağlantıyı dene
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-md border border-[#E6E7EA] px-4 py-2 text-[12px] dark:border-[#23262E]"
            onClick={() => run(() => pushMarketplaceStockAction(channel.id))}
          >
            Stok ve fiyat gönder
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-md border border-[#E6E7EA] px-4 py-2 text-[12px] dark:border-[#23262E]"
            onClick={() => run(() => pullMarketplaceOrdersAction(channel.id))}
          >
            Siparişleri çek
          </button>
        </div>
        {notice ? <p className="text-[12px] text-[#8C9099]">{notice}</p> : null}
        {channel.lastError ? <p className="text-[12px] text-red-600">{channel.lastError}</p> : null}
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold">Son işlemler</h2>
        {jobs.length === 0 ? (
          <p className="text-[12px] text-[#8C9099]">Henüz işlem yok.</p>
        ) : (
          <ul className="space-y-1 text-[12px]">
            {jobs.map((job) => (
              <li key={job.id}>
                <span className="font-medium">{job.kind}</span> · {job.status} · {job.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold">Çekilen siparişler</h2>
        {orders.length === 0 ? (
          <p className="text-[12px] text-[#8C9099]">Kayıt yok.</p>
        ) : (
          <ul className="space-y-1 text-[12px]">
            {orders.map((order) => (
              <li key={order.id}>
                {order.externalId} · {order.buyerName} · {order.status} ·{" "}
                {formatMoney(order.totalCents, order.currency)}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="mt-4 text-[12px] text-red-600 underline"
          onClick={() =>
            start(async () => {
              if (!confirm("Kanal silinsin mi?")) return;
              await deleteMarketplaceChannelAction(channel.id);
              router.push("/admin/commerce/marketplaces");
            })
          }
        >
          Kanalı sil
        </button>
      </section>
    </div>
  );
}
