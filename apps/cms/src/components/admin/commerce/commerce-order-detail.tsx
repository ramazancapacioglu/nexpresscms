"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { CommerceOrderDto, CommerceOrderStatus } from "@nexpress/commerce";
import { formatMoney } from "@nexpress/commerce";
import { updateCommerceOrderStatusAction } from "@/app/admin/commerce/actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

const statuses: CommerceOrderStatus[] = ["pending", "processing", "completed", "cancelled"];

export function CommerceOrderDetail({ order }: { order: CommerceOrderDto }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold">Sipariş {order.orderNumber}</h1>
          <p className="text-[12px] text-[#8C9099]">
            {order.createdAt.toLocaleString("tr-TR")} · {order.customerEmail}
          </p>
        </div>
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-[#8C9099]">Durum</span>
          <select
            className={fieldClass}
            disabled={pending}
            value={order.status}
            onChange={(e) =>
              start(async () => {
                await updateCommerceOrderStatusAction(order.id, e.target.value as CommerceOrderStatus);
                router.refresh();
              })
            }
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
        <h2 className="mb-2 text-[13px] font-semibold">Kalemler</h2>
        <ul className="space-y-2 text-[12px]">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                {item.title} × {item.quantity}
              </span>
              <span>{formatMoney(item.lineTotalCents, order.currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-[#E6E7EA] pt-3 text-[12px] dark:border-[#23262E]">
          <div className="flex justify-between">
            <dt>Ara toplam</dt>
            <dd>{formatMoney(order.subtotalCents, order.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Kargo</dt>
            <dd>{formatMoney(order.shippingCents, order.currency)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Toplam</dt>
            <dd>{formatMoney(order.totalCents, order.currency)}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 text-[12px]">
        <div className="rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
          <h2 className="mb-2 font-semibold">Müşteri</h2>
          <p>{order.customerName}</p>
          <p className="text-[#8C9099]">{order.customerPhone}</p>
          {order.customerNote ? (
            <p className="mt-2 text-[#8C9099]">Not: {order.customerNote}</p>
          ) : null}
        </div>
        <div className="rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
          <h2 className="mb-2 font-semibold">Teslimat</h2>
          <p>{order.shippingAddress.line1}</p>
          {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
          <p>
            {order.shippingAddress.postalCode} {order.shippingAddress.city}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      </section>
    </div>
  );
}
