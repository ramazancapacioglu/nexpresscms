"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PermalinkStructure } from "@nexpress/core";
import { saveSeoEngineSettingsAction } from "@/app/admin/actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

const OPTIONS: Array<{ id: PermalinkStructure; label: string; sample: string }> = [
  { id: "postname", label: "Yazı adı", sample: "/yazi-adi" },
  { id: "plain", label: "Düz", sample: "/yazi-adi" },
  { id: "dayname", label: "Gün ve ad", sample: "/2026/11/10/yazi-adi" },
  { id: "monthname", label: "Ay ve ad", sample: "/2026/11/yazi-adi" },
  { id: "numeric", label: "Sayısal", sample: "/arsiv/123/yazi-adi" },
];

/** Kalıcı bağlantı. Kayıt Apache `.htaccess` dosyasını yeniler. */
export function PermalinkCard({ initial }: { initial: PermalinkStructure }) {
  const router = useRouter();
  const [structure, setStructure] = useState<PermalinkStructure>(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const sample = OPTIONS.find((item) => item.id === structure)?.sample ?? "/yazi-adi";

  const save = () => {
    start(async () => {
      const res = await saveSeoEngineSettingsAction({ seo: { permalinkStructure: structure } });
      const where = res.htaccessPath ? ` .htaccess yenilendi: ${res.htaccessPath}.` : "";
      const fail = res.htaccessError ? ` Dosya yazılamadı: ${res.htaccessError}.` : "";
      setNotice(`Kalıcı bağlantı kaydedildi.${where}${fail} Nginx bu dosyayı okumaz; 404 sürerse kaynak vekil kuralıdır.`);
      router.refresh();
    });
  };

  return (
    <section className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
      <div>
        <h2 className="text-[13px] font-semibold">Kalıcı bağlantılar</h2>
        <p className="mt-1 text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Yazı adı bugünkü /slug adresidir. Tarih ve sayısal yapı aynı sayfayı ek ön ekle de açar. Kayıt .htaccess dosyasını baştan yazar; içinde WordPress index.php kuralı olmaz.
        </p>
      </div>
      <label className="block text-[11px] text-[#5F6570] dark:text-[#8C9099]">
        Yapı
        <select className={`${fieldClass} mt-1`} value={structure} onChange={(e) => setStructure(e.target.value as PermalinkStructure)}>
          {OPTIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} — {item.sample}
            </option>
          ))}
        </select>
      </label>
      <p className="font-mono text-[12px] text-[#14151A] dark:text-[#F3F4F6]">{sample}</p>
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="inline-flex h-8 items-center rounded-md bg-[#14151A] px-3 text-[12px] font-medium text-white disabled:opacity-60 dark:bg-[#F3F4F6] dark:text-[#14151A]"
      >
        {pending ? "Kaydediliyor…" : "Kaydet ve htaccess yenile"}
      </button>
      {notice ? <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">{notice}</p> : null}
    </section>
  );
}
