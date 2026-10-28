"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CommerceShippingMethodDto } from "@nexpress/commerce";
import { centsToInputValue } from "@nexpress/commerce";
import { saveShippingAction } from "@/app/admin/commerce/catalog-actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

export function ShippingBoard({ methods }: { methods: CommerceShippingMethodDto[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [carrier, setCarrier] = useState("");
  const [rate, setRate] = useState("99,00");
  const [freeAt, setFreeAt] = useState("1500,00");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[18px] font-semibold">Kargo</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Açık yöntemler ödeme adımında seçilir. Eşik aşılırsa ücret sıfırlanır.</p>
      </header>
      <form
        className="grid max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => {
            await saveShippingAction({ name, carrier, flatRateInput: rate, freeThresholdInput: freeAt, enabled: true });
            router.refresh();
          });
        }}
      >
        <input className={fieldClass} placeholder="Yöntem adı" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={fieldClass} placeholder="Taşıyıcı" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
        <input className={fieldClass} placeholder="Ücret" value={rate} onChange={(e) => setRate(e.target.value)} />
        <input className={fieldClass} placeholder="Ücretsiz eşik" value={freeAt} onChange={(e) => setFreeAt(e.target.value)} />
        <button disabled={pending} className="w-fit rounded-md bg-[#111318] px-3 py-2 text-[12px] text-white dark:bg-white dark:text-[#111318]">Yöntem ekle</button>
      </form>
      <ul className="text-[12px]">
        {methods.map((method) => (
          <li key={method.id}>
            {method.name} · {method.carrier || "taşıyıcı yok"} · {centsToInputValue(method.flatRateCents)} · eşik {centsToInputValue(method.freeThresholdCents)} · {method.enabled ? "açık" : "kapalı"}
          </li>
        ))}
      </ul>
    </div>
  );
}
