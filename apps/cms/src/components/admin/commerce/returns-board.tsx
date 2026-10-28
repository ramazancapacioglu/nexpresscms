"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CommerceReturnDto } from "@nexpress/commerce";
import { saveReturnAction, updateReturnStatusAction } from "@/app/admin/commerce/catalog-actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

const statuses = ["requested", "approved", "received", "completed", "rejected"] as const;

export function ReturnsBoard({ returns }: { returns: CommerceReturnDto[] }) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [source, setSource] = useState<"site" | "marketplace">("site");
  const [kind, setKind] = useState<"return" | "exchange">("return");
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[18px] font-semibold">İade ve değişim</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Site ve pazar yeri siparişleri aynı listede, kaynak etiketiyle izlenir.</p>
      </header>
      <form
        className="grid max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => {
            await saveReturnAction({ source, orderId: orderId || orderNumber, orderNumber, kind, reason });
            setReason("");
            router.refresh();
          });
        }}
      >
        <input className={fieldClass} placeholder="Sipariş no" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required />
        <input className={fieldClass} placeholder="Sipariş kayıt id (isteğe bağlı)" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
        <select className={fieldClass} value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
          <option value="site">Site</option>
          <option value="marketplace">Pazar yeri</option>
        </select>
        <select className={fieldClass} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="return">İade</option>
          <option value="exchange">Değişim</option>
        </select>
        <input className={fieldClass} placeholder="Gerekçe" value={reason} onChange={(e) => setReason(e.target.value)} required />
        <button disabled={pending} className="w-fit rounded-md bg-[#111318] px-3 py-2 text-[12px] text-white dark:bg-white dark:text-[#111318]">Kayıt aç</button>
      </form>
      <ul className="space-y-2 text-[12px]">
        {returns.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#E6E7EA] px-3 py-2 dark:border-[#23262E]">
            <span>
              {item.orderNumber} · {item.source === "site" ? "Site" : "Pazar yeri"} · {item.kind === "return" ? "İade" : "Değişim"} · {item.reason}
            </span>
            <select
              className={fieldClass}
              value={item.status}
              onChange={(e) =>
                start(async () => {
                  await updateReturnStatusAction(item.id, e.target.value as (typeof statuses)[number]);
                  router.refresh();
                })
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
