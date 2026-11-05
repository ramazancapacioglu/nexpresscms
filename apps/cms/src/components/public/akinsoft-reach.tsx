import React from "react";
import { headers } from "next/headers";
import { AKINSOFT_REACH_FORM_ID } from "@nexpress/themes";
import { createFormToken } from "@/lib/form-token";

/** Sağ kenar demo formu. Açılış `<details>` ile, gönderim düz POST. */
export async function AkinsoftReach({ locale }: { locale: string }) {
  const search = (await headers()).get("x-nexpress-search") ?? "";
  const sent = new URLSearchParams(search).get("form") === "sent";
  const path = `/${locale}`;
  return (
    <details className="nx-as-reach" {...(sent ? { open: true } : {})}>
      <summary>Bize ulaşın</summary>
      <div>
        <p className="mb-2 text-sm font-semibold text-[#1d1d1f]">Demo talebi</p>
        {sent ? <p className="mb-2 text-sm text-[#00ac48]">Talebiniz alındı.</p> : null}
        <form action="/api/forms/submit" method="post" className="space-y-2">
          <input type="hidden" name="_path" value={path} />
          <input type="hidden" name="_form" value={AKINSOFT_REACH_FORM_ID} />
          <input type="hidden" name="_t" value={createFormToken(path)} />
          <div style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
            <label>Website <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
          </div>
          <input name="ad" required placeholder="Ad soyad" className="w-full rounded-lg border border-[#d2d2d7] px-3 py-2 text-sm" />
          <input name="telefon" required placeholder="Telefon" className="w-full rounded-lg border border-[#d2d2d7] px-3 py-2 text-sm" />
          <input name="eposta" type="email" required placeholder="E-posta" className="w-full rounded-lg border border-[#d2d2d7] px-3 py-2 text-sm" />
          <textarea name="mesaj" rows={3} placeholder="Mesaj" className="w-full rounded-lg border border-[#d2d2d7] px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded-full bg-[#0071e3] py-2 text-sm font-semibold text-white">Gönder</button>
        </form>
      </div>
    </details>
  );
}
