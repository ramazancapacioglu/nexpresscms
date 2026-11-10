"use client";

import React, { useState } from "react";
import { wipeContentAction } from "@/app/admin/settings/actions";
import { issueBridgeCodeAction, reconstructBridgeDatasetAction, repairBridgeAction } from "./actions";

type BridgeReportView = {
  at: string;
  created: number;
  updated: number;
  failed: number;
  links: number;
  images: number;
  forms: number;
  redirects: number;
  unknown: number;
  menus: number;
};

/** İndirme, eşleştirme kodu, son aktarım sayıları ve sıfırlama. */
export function BridgePanel({ version, report, pluginOn }: { version: string; report: BridgeReportView | null; pluginOn: boolean }) {
  const [phrase, setPhrase] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [expires, setExpires] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [reconstructing, setReconstructing] = useState(false);

  const reconstruct = async () => {
    setReconstructing(true);
    setError(null);
    setMessage(null);
    try {
      const result = await reconstructBridgeDatasetAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        `${result.pagesUpdated} sayfa, ${result.postsUpdated} yazı, ${result.categoriesUpdated} kategori ve ${result.imagesCopied} yerel görsel zengin blok yerleşimiyle yeniden derlendi.`
      );
    } catch {
      setError("Yeniden derleme sırasında hata oluştu.");
    } finally {
      setReconstructing(false);
    }
  };

  const issue = async () => {
    setIssuing(true);
    setError(null);
    try {
      const result = await issueBridgeCodeAction();
      if (!result.ok) {
        setError(result.error ?? "Kod üretilemedi.");
        return;
      }
      setCode(result.code);
      setExpires(result.expiresAt);
    } catch {
      setError("Kod üretilemedi.");
    } finally {
      setIssuing(false);
    }
  };

  const repair = async () => {
    setRepairing(true);
    setError(null);
    setMessage(null);
    try {
      const result = await repairBridgeAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(`Sayfa ${result.pages}, ayrılan başlık ${result.split}, indirilen görsel ${result.downloaded}, AI yerleşim ${result.drawn}.${result.note ? ` ${result.note}` : ""}`);
    } catch {
      setError("Tamamlama yarım kaldı. Bir kez daha deneyin.");
    } finally {
      setRepairing(false);
    }
  };

  const reset = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const result = await wipeContentAction({ kind: "everything", phrase });
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Sıfırlama olmadı.");
      return;
    }
    setPhrase("");
    setMessage(result.detail ? `Silindi: ${result.detail}. Şablon ve tasarım kütüphanesi duruyor.` : "İçerik silindi.");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
        <h2 className="text-[15px] font-semibold">Site eklentisi {version}</h2>
        <p className="mt-1 text-[13px] text-[#5F6570] dark:text-[#8C9099]">
          Zip’i WordPress’e kurun. Menü: Araçlar → NexPress Aktarım. Eski 0.1.0 kuruluysa bu sürümü yükleyin.
        </p>
        <a
          href="/api/admin/wp-bridge/plugin"
          className="mt-3 inline-flex rounded-md bg-[#14151A] px-3 py-2 text-[13px] font-medium text-white dark:bg-[#F3F4F6] dark:text-[#14151A]"
        >
          nexpress-bridge-{version}.zip indir
        </a>
      </section>

      <section className="rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
        <h2 className="text-[15px] font-semibold">Eşleştirme kodu</h2>
        <p className="mt-1 text-[13px] text-[#5F6570] dark:text-[#8C9099]">
          Kod burada üretilir, WordPress’teki kutuya yapıştırılır. Adres bu sitenin https adresi olsun. Kod 30 dakika ve tek kullanımlıktır. Aktarım WordPress’te “Aktarımı başlat” ile gider.
        </p>
        <button type="button" onClick={issue} disabled={issuing || !pluginOn} className="mt-3 rounded-md border border-[#14151A] px-3 py-1.5 text-[13px] font-medium dark:border-[#F3F4F6]">
          {issuing ? "Üretiliyor…" : "Kod üret"}
        </button>
        {!pluginOn ? <p className="mt-2 text-[13px] text-amber-700">Eklenti kapalı. Eklentiler sayfasından açın.</p> : null}
        {code ? (
          <p className="mt-3 font-mono text-[18px] tracking-widest text-[#14151A] dark:text-[#F3F4F6]">
            {code.slice(0, 4)}-{code.slice(4)}
            <span className="ml-3 font-sans text-[12px] tracking-normal text-[#5F6570]">{expires ? `Geçerlilik: ${new Date(expires).toLocaleString("tr-TR")}` : ""}</span>
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
        <h2 className="text-[15px] font-semibold">Veri kümesinden derle</h2>
        <p className="mt-1 text-[13px] text-[#5F6570] dark:text-[#8C9099]">
          Eşleşmiş siteyi okumaz. Depoda aktarım dosyası varsa sayfa, yazı, kategori, menü ve üst şeridi oradan yazar. Dosyada ayrı bir ana sayfa yoksa öne çıkan sayfayı Sayfalar ekranından seçin. `blog` adresi yazı listesi olur. Dosya yoksa hiçbir kayıt değişmez. Çöp ve taslak yayına alınmaz.
        </p>
        <button
          type="button"
          onClick={reconstruct}
          disabled={reconstructing || repairing || !pluginOn}
          className="mt-3 rounded-md bg-[#14151A] px-3 py-1.5 text-[13px] font-medium text-white dark:bg-[#F3F4F6] dark:text-[#14151A]"
        >
          {reconstructing ? "Derleniyor…" : "Veri kümesini zengin yerleşimle derle"}
        </button>
      </section>

      {message ? <p className="text-[13px] text-emerald-700 dark:text-emerald-400">{message}</p> : null}
      {error ? <p className="text-[13px] text-amber-700">{error}</p> : null}

      <section className="rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
        <h2 className="text-[15px] font-semibold">İçe aktarılanı onar</h2>
        <p className="mt-1 text-[13px] text-[#5F6570] dark:text-[#8C9099]">
          Eşleşmiş siteden gelen göreli görselleri indirir, yapışık başlıkları ayırır ve yerleşimi boş sayfaları tamamlar. Veri kümesine dokunmaz.
        </p>
        <button
          type="button"
          onClick={repair}
          disabled={repairing || reconstructing || !pluginOn}
          className="mt-3 rounded-md border border-[#14151A] px-3 py-1.5 text-[13px] font-medium dark:border-[#F3F4F6]"
        >
          {repairing ? "Onarılıyor…" : "Eksikleri tamamla"}
        </button>
      </section>

      {report ? (
        <section className="rounded-lg border border-[#E6E7EA] p-4 text-[13px] dark:border-[#23262E]">
          <h2 className="text-[15px] font-semibold">Son aktarım</h2>
          <p className="mt-1 text-[#5F6570] dark:text-[#8C9099]">{new Date(report.at).toLocaleString("tr-TR")}</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            <li>Yeni içerik: {report.created}</li>
            <li>Güncellenen: {report.updated}</li>
            <li>Hata: {report.failed}</li>
            <li>Çevrilen bağlantı: {report.links}</li>
            <li>İndirilen görsel: {report.images}</li>
            <li>Form: {report.forms}</li>
            <li>Yönlendirme: {report.redirects}</li>
            <li>Menü: {report.menus}</li>
            <li>Düz metne düşen blok: {report.unknown}</li>
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <h2 className="text-[15px] font-semibold">Aktarım öncesi sıfırlama</h2>
        <p className="mt-1 text-[13px]">
          Sayfa, yazı, diğer içerik, yorum ve medya silinir. Şablon, tasarım kütüphanesi, tema, menü, form tanımı, kullanıcı ve site ayarı kalır.
        </p>
        <form onSubmit={reset} className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-[13px]" htmlFor="nx-bridge-phrase">
            Onay
            <input
              id="nx-bridge-phrase"
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              className="ml-2 rounded-md border border-amber-400 bg-white px-2 py-1.5 text-[13px] text-[#14151A]"
              autoComplete="off"
              placeholder="SIFIRLA"
            />
          </label>
          <button type="submit" disabled={pending} className="rounded-md border border-amber-700 px-3 py-1.5 text-[13px] font-medium">
            {pending ? "Siliniyor…" : "İçeriği sıfırla"}
          </button>
        </form>
        {error ? <p className="mt-2 text-[13px]">{error}</p> : null}
        {message ? <p className="mt-2 text-[13px]">{message}</p> : null}
      </section>
    </div>
  );
}
