"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CommerceCustomerDto, CommerceCustomerGroupDto } from "@nexpress/commerce";
import { saveCustomerAction, saveCustomerGroupAction } from "@/app/admin/commerce/catalog-actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

export function CustomerBoard({
  customers,
  groups,
  source,
}: {
  customers: CommerceCustomerDto[];
  groups: CommerceCustomerGroupDto[];
  source: "all" | "site" | "marketplace";
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [groupName, setGroupName] = useState("");
  const [pending, start] = useTransition();
  const groupNameOf = (id: string | null) => groups.find((group) => group.id === id)?.name ?? "—";

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[18px] font-semibold">Müşteriler</h1>
        <p className="text-[12px] text-[#8C9099]">Site kasası ve pazar yeri alıcıları ayrı kayıtlarda durur.</p>
      </header>
      <div className="flex gap-2 text-[12px]">
        {(["all", "site", "marketplace"] as const).map((item) => (
          <Link
            key={item}
            href={item === "all" ? "/admin/commerce/customers" : `/admin/commerce/customers?source=${item}`}
            className={`rounded px-2 py-1 ${source === item ? "bg-[#111318] text-white dark:bg-white dark:text-[#111318]" : "border border-[#E6E7EA] dark:border-[#23262E]"}`}
          >
            {item === "all" ? "Tümü" : item === "site" ? "Site" : "Pazar yeri"}
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            start(async () => {
              await saveCustomerAction({ name, email, source: "site" });
              router.refresh();
            });
          }}
        >
          <h2 className="text-[13px] font-semibold">Site müşterisi</h2>
          <input className={fieldClass} placeholder="Ad" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className={fieldClass} placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={pending} className="rounded-md bg-[#111318] px-3 py-2 text-[12px] text-white dark:bg-white dark:text-[#111318]">Ekle</button>
        </form>
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            start(async () => {
              await saveCustomerGroupAction({ name: groupName });
              setGroupName("");
              router.refresh();
            });
          }}
        >
          <h2 className="text-[13px] font-semibold">Müşteri grubu</h2>
          <input className={fieldClass} placeholder="Grup adı" value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
          <button disabled={pending} className="rounded-md border border-[#E6E7EA] px-3 py-2 text-[12px] dark:border-[#23262E]">Grup ekle</button>
          <p className="text-[11px] text-[#8C9099]">{groups.map((group) => group.name).join(", ") || "Grup yok"}</p>
        </form>
      </div>
      <ul className="divide-y divide-[#E6E7EA] rounded-lg border border-[#E6E7EA] dark:divide-[#23262E] dark:border-[#23262E]">
        {customers.map((customer) => (
          <li key={customer.id} className="flex items-center justify-between px-3 py-2 text-[12px]">
            <div>
              <Link href={`/admin/commerce/customers/${customer.id}`} className="font-medium hover:underline">{customer.name}</Link>
              <p className="text-[#8C9099]">
                {customer.source === "site" ? "Site" : "Pazar yeri"} · {customer.email || "e-posta yok"} · {groupNameOf(customer.groupId)} · {customer.loyaltyPoints} puan
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
