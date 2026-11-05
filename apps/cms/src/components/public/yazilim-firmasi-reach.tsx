import React from "react";
import { headers } from "next/headers";
import { YF_REACH_FORM_ID } from "@nexpress/themes";
import { createFormToken } from "@/lib/form-token";

const PATH_RE = /^\/([a-z]{2,3}(?:-[a-z0-9]{2,8})?)(?:\/([a-z0-9][a-z0-9-]{0,120}))?$/;

/** Yapışkan "Sizi arayalım" kutusu. Açılış `<details>` ile, gönderim düz POST; sonuç gönderildiği sayfaya döner. */
export async function YazilimFirmasiReach({ locale }: { locale: string }) {
  const h = await headers();
  const search = new URLSearchParams(h.get("x-nexpress-search") ?? "");
  const current = h.get("x-nexpress-path") ?? "";
  const path = PATH_RE.test(current) ? current : `/${locale}`;
  const sent = search.get("form") === "sent" && !search.get("fb");
  const failed = search.get("form") === "error" && !search.get("fb");
  return (
    <details className="nx-yf-reach" {...(sent || failed ? { open: true } : {})}>
      <summary>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>
        <span>Sizi arayalım</span>
      </summary>
      <div>
        <p className="nx-yf-reach-title">Bilgilerinizi bırakın, sizi arayalım.</p>
        {sent ? <p role="status" className="nx-yf-reach-ok">Talebiniz alındı. Uzmanımız sizi arayacak.</p> : null}
        {failed ? <p role="alert" className="nx-yf-reach-err">Gönderilemedi. Alanları kontrol edip tekrar deneyin.</p> : null}
        <form action="/api/forms/submit" method="post">
          <input type="hidden" name="_path" value={path} />
          <input type="hidden" name="_form" value={YF_REACH_FORM_ID} />
          <input type="hidden" name="_t" value={createFormToken(path)} />
          <div style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
            <label>Website <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
          </div>
          <label className="sr-only" htmlFor="yf-reach-ad">Ad soyad</label>
          <input id="yf-reach-ad" name="ad" required placeholder="Ad soyad" autoComplete="name" />
          <label className="sr-only" htmlFor="yf-reach-tel">Telefon</label>
          <input id="yf-reach-tel" name="telefon" type="tel" required placeholder="Telefon" autoComplete="tel" />
          <label className="nx-yf-reach-consent">
            <input type="checkbox" name="onay" value="evet" required />
            <span>Aydınlatma metnini okudum ve anladım.</span>
          </label>
          <button type="submit">Gönder</button>
        </form>
      </div>
    </details>
  );
}
