"use client";

import Link from "next/link";
import type { CommerceOrderDto } from "@nexpress/commerce";
import { formatMoney } from "@nexpress/commerce";

const statusLabel: Record<string, string> = {
  pending: "Bekliyor",
  processing: "Hazırlanıyor",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

export function CommerceOrdersClient({ orders }: { orders: CommerceOrderDto[] }) {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[18px] font-semibold">Siparişler</h1>
        <p className="text-[12px] text-[#8C9099]">Mağaza ön yüzünden gelen sipariş kayıtları.</p>
      </header>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#E6E7EA] p-6 text-[13px] text-[#8C9099] dark:border-[#23262E]">
          Henüz sipariş yok.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E6E7EA] dark:border-[#23262E]">
          <table className="w-full min-w-[720px] text-left text-[12px]">
            <thead className="bg-[#F7F8FA] text-[#8C9099] dark:bg-[#14161B]">
              <tr>
                <th className="px-3 py-2 font-medium">No</th>
                <th className="px-3 py-2 font-medium">Müşteri</th>
                <th className="px-3 py-2 font-medium">Toplam</th>
                <th className="px-3 py-2 font-medium">Durum</th>
                <th className="px-3 py-2 font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-[#E6E7EA] dark:border-[#23262E]">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/commerce/orders/${o.id}`}
                      className="font-medium hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <div>{o.customerName}</div>
                    <div className="text-[11px] text-[#8C9099]">{o.customerEmail}</div>
                  </td>
                  <td className="px-3 py-2">{formatMoney(o.totalCents, o.currency)}</td>
                  <td className="px-3 py-2">{statusLabel[o.status] ?? o.status}</td>
                  <td className="px-3 py-2 text-[#8C9099]">
                    {o.createdAt.toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
