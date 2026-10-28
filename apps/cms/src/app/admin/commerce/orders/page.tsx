import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { formatMoney } from "@nexpress/commerce";
import { getCommerceRepository, getMarketplaceRepository } from "@nexpress/database";

export const dynamic = "force-dynamic";

export default async function AdminCommerceOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const filter = source === "site" || source === "marketplace" ? source : "all";
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const [siteOrders, channels] = await Promise.all([
    getCommerceRepository(siteId).listOrders(100),
    getMarketplaceRepository(siteId).listChannels(),
  ]);
  const marketLists = await Promise.all(
    channels.map(async (channel) => ({
      channel,
      orders: await getMarketplaceRepository(siteId).listInboundOrders(channel.id, 50),
    }))
  );
  const rows = [
    ...siteOrders.map((order) => ({
      id: order.id,
      href: `/admin/commerce/orders/${order.id}`,
      number: order.orderNumber,
      customer: order.customerName,
      total: formatMoney(order.totalCents, order.currency),
      status: order.status,
      source: "Site" as const,
      createdAt: order.createdAt,
    })),
    ...marketLists.flatMap(({ channel, orders }) =>
      orders.map((order) => ({
        id: order.id,
        href: `/admin/commerce/marketplaces/${channel.id}`,
        number: order.externalId,
        customer: order.buyerName,
        total: formatMoney(order.totalCents, order.currency),
        status: order.status,
        source: `Pazar · ${channel.label}` as const,
        createdAt: order.createdAt,
      }))
    ),
  ]
    .filter((row) => (filter === "all" ? true : filter === "site" ? row.source === "Site" : row.source.startsWith("Pazar")))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[18px] font-semibold">Siparişler</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Kaynak sütunu siparişin siteden mi pazardan mı geldiğini gösterir.</p>
      </header>
      <div className="flex gap-2 text-[12px]">
        {(["all", "site", "marketplace"] as const).map((item) => (
          <Link
            key={item}
            href={item === "all" ? "/admin/commerce/orders" : `/admin/commerce/orders?source=${item}`}
            className={`rounded px-2 py-1 ${filter === item ? "bg-[#111318] text-white dark:bg-white dark:text-[#111318]" : "border border-[#E6E7EA] dark:border-[#23262E]"}`}
          >
            {item === "all" ? "Tümü" : item === "site" ? "Site" : "Pazar yeri"}
          </Link>
        ))}
        <Link href="/admin/commerce/returns" className="rounded border border-[#E6E7EA] px-2 py-1 dark:border-[#23262E]">
          İade ve değişim
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Kayıt yok.</p>
      ) : (
        <table className="w-full text-left text-[12px]">
          <thead className="text-[#5F6570] dark:text-[#8C9099]">
            <tr>
              <th className="py-2">No</th>
              <th>Müşteri</th>
              <th>Kaynak</th>
              <th>Toplam</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#E6E7EA] dark:border-[#23262E]">
                <td className="py-2"><Link href={row.href} className="hover:underline">{row.number}</Link></td>
                <td>{row.customer}</td>
                <td>{row.source}</td>
                <td>{row.total}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
