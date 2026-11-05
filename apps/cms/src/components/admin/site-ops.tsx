"use client";

import { useState, useTransition } from "react";
import { saveMaintenanceAction, wipeContentAction, wipeDesignAction, type SettingsResult } from "@/app/admin/settings/actions";
import type { ContentWipe } from "@nexpress/database";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const card = `rounded-lg border ${border} bg-white dark:bg-[#15171C] p-4 space-y-3`;
const field = `h-8 w-full rounded border ${border} bg-transparent px-2 text-[12px] outline-none focus:ring-1 focus:ring-[#266DF0]`;

const CONTENT_OPTIONS: Array<{ id: ContentWipe; label: string; detail: string }> = [
  { id: "pages", label: "Sayfaları sil", detail: "Yalnızca sayfa kayıtları gider. Yazı, ürün, medya, şablon ve tema durur." },
  { id: "media", label: "Medya dosyalarını sil", detail: "Görsel, belge ve klasörler gider. İçerik metni durur; içindeki görseller kırılabilir." },
  { id: "everything", label: "Tüm içeriği sil", detail: "Sayfa, yazı, ürün, kampanya ve bilgi kayıtları ile medya gider. Şablon, tema, kütüphane, kullanıcı ve ayar durur." },
];

/** Bakım anahtarı ve iki ayrı sıfırlama. Onay sözcüğü yanlışsa sunucu silmez. */
export function SiteOps({
  maintenance,
}: {
  maintenance: { enabled: boolean; message: string };
}) {
  const [enabled, setEnabled] = useState(maintenance.enabled);
  const [message, setMessage] = useState(maintenance.message);
  const [kind, setKind] = useState<ContentWipe>("pages");
  const [contentPhrase, setContentPhrase] = useState("");
  const [designPhrase, setDesignPhrase] = useState("");
  const [note, setNote] = useState<(SettingsResult & { detail?: string }) | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="max-w-2xl space-y-4">
      <form
        className={card}
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => setNote(await saveMaintenanceAction({ enabled, message })));
        }}
      >
        <div>
          <h2 className="text-[14px] font-semibold">Bakım modu</h2>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Ziyaretçi bakım metnini görür. Panel açık kalır. Oturumu olan kullanıcı siteyi görmeye devam eder.</p>
        </div>
        <label className="flex items-center gap-2 text-[12px] font-medium">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Bakım modunu aç
        </label>
        <label className="block space-y-1 text-[12px] font-medium">Ziyaretçiye görünen metin
          <textarea maxLength={400} value={message} onChange={(e) => setMessage(e.target.value)} className={`${field} h-20 py-2`} placeholder="Boşsa hazır metin kullanılır." />
        </label>
        <button type="submit" disabled={pending} className="h-8 rounded bg-[#266DF0] px-3 text-[12px] font-medium text-white disabled:opacity-60">Kaydet</button>
      </form>

      <form
        className={card}
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await wipeContentAction({ kind, phrase: contentPhrase });
            setNote(res);
            if (res.ok) setContentPhrase("");
          });
        }}
      >
        <div>
          <h2 className="text-[14px] font-semibold">İçerik sıfırlama</h2>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Bir seçenek işaretleyin ve onay kutusuna SIFIRLA yazın. Yanlış sözcükte hiçbir kayıt silinmez.</p>
        </div>
        <div className="space-y-2">
          {CONTENT_OPTIONS.map((option) => (
            <label key={option.id} className={`block rounded border ${border} px-3 py-2 text-[12px]`}>
              <span className="flex items-center gap-2 font-medium">
                <input type="radio" name="wipe" checked={kind === option.id} onChange={() => setKind(option.id)} />
                {option.label}
              </span>
              <span className="mt-1 block pl-5 text-[#5F6570] dark:text-[#8C9099]">{option.detail}</span>
            </label>
          ))}
        </div>
        <label className="block space-y-1 text-[12px] font-medium">Onay
          <input value={contentPhrase} onChange={(e) => setContentPhrase(e.target.value)} className={field} autoComplete="off" placeholder="SIFIRLA" />
        </label>
        <button type="submit" disabled={pending} className="h-8 rounded bg-red-700 px-3 text-[12px] font-medium text-white disabled:opacity-60">İçeriği sıfırla</button>
      </form>

      <form
        className={card}
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await wipeDesignAction({ phrase: designPhrase });
            setNote(res);
            if (res.ok) setDesignPhrase("");
          });
        }}
      >
        <div>
          <h2 className="text-[14px] font-semibold">Tasarım sıfırlama</h2>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Şablonlar, tasarım kütüphanesi ve yüklenen temalar ayrı silinir. Sayfa, yazı ve medya durur. Onay sözcüğü TASARIM.</p>
        </div>
        <label className="block space-y-1 text-[12px] font-medium">Onay
          <input value={designPhrase} onChange={(e) => setDesignPhrase(e.target.value)} className={field} autoComplete="off" placeholder="TASARIM" />
        </label>
        <button type="submit" disabled={pending} className="h-8 rounded bg-red-700 px-3 text-[12px] font-medium text-white disabled:opacity-60">Tasarımı sıfırla</button>
      </form>

      {note && (note.ok ? <p role="status" className="text-[12px] text-emerald-800">{note.detail ?? "Kaydedildi."}</p> : <p role="alert" className="text-[12px] text-red-600">{note.error}</p>)}
    </div>
  );
}
