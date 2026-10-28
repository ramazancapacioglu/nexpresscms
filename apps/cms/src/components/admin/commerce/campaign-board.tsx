"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CommerceCampaignDto, CommerceCouponDto, CommerceCustomerDto, CommerceCustomerGroupDto } from "@nexpress/commerce";
import { saveCampaignAction, saveCouponAction } from "@/app/admin/commerce/catalog-actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

export function CampaignBoard({
  campaigns,
  coupons,
  groups,
  customers,
}: {
  campaigns: CommerceCampaignDto[];
  coupons: CommerceCouponDto[];
  groups: CommerceCustomerGroupDto[];
  customers: CommerceCustomerDto[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed" | "free_shipping">("percent");
  const [value, setValue] = useState("10");
  const [audience, setAudience] = useState<"all" | "group" | "customer">("all");
  const [groupId, setGroupId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[18px] font-semibold">Kampanyalar</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Herkese, bir gruba veya tek müşteriye kupon bağlanabilir.</p>
      </header>
      <form
        className="grid max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => {
            await saveCampaignAction({
              name,
              discountType,
              value: Number(value) || 0,
              audience,
              groupId: audience === "group" ? groupId : undefined,
              customerId: audience === "customer" ? customerId : undefined,
              active: true,
            });
            router.refresh();
          });
        }}
      >
        <input className={fieldClass} placeholder="Kampanya adı" value={name} onChange={(e) => setName(e.target.value)} required />
        <select className={fieldClass} value={discountType} onChange={(e) => setDiscountType(e.target.value as typeof discountType)}>
          <option value="percent">Yüzde</option>
          <option value="fixed">Sabit kuruş</option>
          <option value="free_shipping">Ücretsiz kargo</option>
        </select>
        <input className={fieldClass} value={value} onChange={(e) => setValue(e.target.value)} />
        <select className={fieldClass} value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)}>
          <option value="all">Herkes</option>
          <option value="group">Müşteri grubu</option>
          <option value="customer">Tek müşteri</option>
        </select>
        {audience === "group" ? (
          <select className={fieldClass} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Grup seçin</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
        ) : null}
        {audience === "customer" ? (
          <select className={fieldClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Müşteri seçin</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        ) : null}
        <button disabled={pending} className="w-fit rounded-md bg-[#111318] px-3 py-2 text-[12px] text-white dark:bg-white dark:text-[#111318]">Kampanya kaydet</button>
      </form>
      <ul className="text-[12px]">
        {campaigns.map((campaign) => (
          <li key={campaign.id}>{campaign.name} · {campaign.audience} · {campaign.discountType} {campaign.value}</li>
        ))}
      </ul>
      <form
        className="flex max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => {
            await saveCouponAction({
              code,
              discountType,
              value: discountType === "fixed" ? Number(value) || 0 : Number(value) || 0,
              groupId: audience === "group" ? groupId : undefined,
              customerId: audience === "customer" ? customerId : undefined,
              active: true,
            });
            setCode("");
            router.refresh();
          });
        }}
      >
        <input className={fieldClass} placeholder="Kupon kodu" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button className="rounded-md border px-3 text-[12px]">Kupon oluştur</button>
      </form>
      <ul className="text-[12px]">
        {coupons.map((coupon) => (
          <li key={coupon.id}>{coupon.code} · {coupon.discountType} {coupon.value} · müşteri {coupon.customerId ? "özel" : "genel"} · grup {coupon.groupId ? "özel" : "genel"}</li>
        ))}
      </ul>
    </div>
  );
}
