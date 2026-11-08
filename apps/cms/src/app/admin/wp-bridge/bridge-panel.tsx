"use client";

import React, { useState } from "react";
import { wipeContentAction } from "@/app/admin/settings/actions";

/** İndirme bağlantısı ve aktarım öncesi sıfırlama. Şablon ile kütüphane bu kapının dışında. */
export function BridgePanel({ version }: { version: string }) {
  const [phrase, setPhrase] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          Zip’i WordPress’e kurun. Araçlar menüsünde NexPress Aktarım açılır. E-ticaret bu pakette yoktur.
        </p>
        <a
          href="/api/admin/wp-bridge/plugin"
          className="mt-3 inline-flex rounded-md bg-[#14151A] px-3 py-2 text-[13px] font-medium text-white dark:bg-[#F3F4F6] dark:text-[#14151A]"
        >
          nexpress-bridge-{version}.zip indir
        </a>
      </section>

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
