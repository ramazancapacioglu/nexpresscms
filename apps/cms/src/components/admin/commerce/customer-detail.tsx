"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  CommerceCouponDto,
  CommerceCustomerDto,
  CommerceCustomerGroupDto,
  CommerceLoyaltyEntryDto,
} from "@nexpress/commerce";
import { addLoyaltyAction, saveCouponAction, saveCustomerAction } from "@/app/admin/commerce/catalog-actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

export function CustomerDetail({
  customer,
  groups,
  ledger,
  coupons,
  orders,
}: {
  customer: CommerceCustomerDto;
  groups: CommerceCustomerGroupDto[];
  ledger: CommerceLoyaltyEntryDto[];
  coupons: CommerceCouponDto[];
  orders: Array<{ number: string; totalLabel: string; source: string }>;
}) {
  const router = useRouter();
  const [groupId, setGroupId] = useState(customer.groupId ?? "");
  const [points, setPoints] = useState("10");
  const [reason, setReason] = useState("Manuel puan");
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-[18px] font-semibold">{customer.name}</h1>
        <p className="text-[12px] text-[#8C9099]">
          {customer.source === "site" ? "Siteden" : "Sanal pazardan"} · {customer.loyaltyPoints} sadakat puanı
        </p>
      </header>
      <section className="grid gap-2">
        <label className="text-[12px]">
          Grup
          <select className={fieldClass} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Yok</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending}
          className="w-fit rounded-md bg-[#111318] px-3 py-2 text-[12px] text-white dark:bg-white dark:text-[#111318]"
          onClick={() =>
            start(async () => {
              await saveCustomerAction({
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone ?? undefined,
                groupId,
                source: customer.source,
              });
              router.refresh();
            })
          }
        >
          Grubu kaydet
        </button>
      </section>
      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold">Sadakat</h2>
        <div className="flex gap-2">
          <input className={fieldClass} value={points} onChange={(e) => setPoints(e.target.value)} />
          <input className={fieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          <button
            type="button"
            className="rounded-md border px-3 text-[12px]"
            onClick={() =>
              start(async () => {
                await addLoyaltyAction(customer.id, Number(points) || 0, reason);
                router.refresh();
              })
            }
          >
            Puan yaz
          </button>
        </div>
        <ul className="text-[12px] text-[#8C9099]">
          {ledger.map((entry) => (
            <li key={entry.id}>{entry.points} · {entry.reason}</li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold">Bu müşteriye kupon</h2>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            start(async () => {
              await saveCouponAction({
                code,
                discountType: "percent",
                value: 10,
                customerId: customer.id,
                active: true,
              });
              setCode("");
              router.refresh();
            });
          }}
        >
          <input className={fieldClass} placeholder="OZEL10" value={code} onChange={(e) => setCode(e.target.value)} required />
          <button className="rounded-md border px-3 text-[12px]">%10 kupon</button>
        </form>
        <ul className="text-[12px]">
          {coupons.map((coupon) => (
            <li key={coupon.id}>{coupon.code} · {coupon.discountType} {coupon.value} · {coupon.usedCount} kullanım</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-[13px] font-semibold">Siparişler</h2>
        <ul className="text-[12px]">
          {orders.map((order) => (
            <li key={order.number}>{order.number} · {order.source} · {order.totalLabel}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
