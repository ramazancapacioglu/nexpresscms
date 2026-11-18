import React from "react";
import { safeBlockDomId, type BlockNode, type DesignTokens } from "@nexpress/core";
import type { createTranslator } from "@nexpress/i18n";
import { RscBlockRenderer } from "@nexpress/themes";
import { createFormToken } from "@/lib/form-token";
import { privacyEmbedUrl } from "@/lib/privacy";
import { getPublicForms } from "@/lib/public-data";

type T = ReturnType<typeof createTranslator>;

const BLOCK_ID = "nx_callback";

/**
 * Her sayfada sabit hızlı iletişim: sağ altta "Sizi arayalım" düğmesi (CSS `:target` ile açılan pencere, betik yok) ve
 * sol altta WhatsApp düğmesi. Form ayarlardan gelir (`general.quickContactFormId`); gönderim sayfadaki formlarla aynı yolu kullanır
 * (`/api/forms/submit`, gelen kutusu, bildirim). Gönderimden sonra pencere sonuç iletisiyle yeniden açılır.
 */
export async function QuickContact({
  siteId,
  formId,
  whatsapp,
  path,
  search,
  tokens,
  themeId,
  locale,
  lb,
  t,
}: {
  siteId: string;
  formId: string;
  whatsapp: string;
  path: string;
  search: string;
  tokens: DesignTokens;
  themeId: string;
  locale: string;
  lb: string;
  t: T;
}) {
  const safeForm = /^frm_[a-z0-9_]{1,40}$/.test(formId) ? formId : "";
  const forms = safeForm ? await getPublicForms(siteId, safeForm) : {};
  const form = safeForm ? forms[safeForm] : undefined;
  const open = form?.status === "active";
  const phone = /^\d{10,15}$/.test(whatsapp) ? whatsapp : "";
  if (!open && !phone) return null;
  const params = new URLSearchParams(search);
  const status = params.get("form") === "sent" || params.get("form") === "error" ? (params.get("form") as "sent" | "error") : null;
  const modalId = safeBlockDomId(BLOCK_ID);
  const privacyUrl = open ? await privacyEmbedUrl(siteId, locale, lb) : "";
  const block: BlockNode = { id: BLOCK_ID, type: "form_block", props: { formId: safeForm, title: "" } };
  const ctx = { forms, path, token: createFormToken(path), status: params.get("fb") === BLOCK_ID ? status : null, blockId: params.get("fb") ?? null, privacyUrl } as const;
  return (
    <>
      {phone ? (
        <a
          href={`https://api.whatsapp.com/send/?phone=${phone}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("quick.whatsapp")}
          style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }}
          className="fixed bottom-4 left-4 z-40 grid h-13 w-13 place-items-center rounded-full shadow-lg ring-2 ring-white/80 transition hover:scale-105"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.6-.1 1.1Z" /></svg>
        </a>
      ) : null}
      {open ? (
        <>
          <a
            href={`#${modalId}`}
            style={{ backgroundColor: tokens.colors.primary, color: tokens.colors.primaryForeground }}
            className="nx-quick-trigger"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            <span>{t("quick.callback")}</span>
          </a>
          <div id={modalId} className="nx-quick-modal" role="dialog" aria-label={t("quick.title")}>
            <a href={path || "#"} aria-label={t("quick.close")} className="nx-quick-backdrop" />
            <div style={{ borderRadius: tokens.geometry.borderRadius }} className="nx-quick-panel bg-nx-card p-5 shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 style={{ color: tokens.colors.secondary, fontFamily: tokens.typography.headingFont }} className="text-lg font-extrabold">{t("quick.title")}</h2>
                <a href={path || "#"} className="rounded px-2 py-1 text-sm text-nx-soft hover:bg-nx-subtle">{t("quick.close")} ✕</a>
              </div>
              <RscBlockRenderer blocks={[block]} themeId={themeId} tokens={tokens} locale={locale} form={ctx} />
            </div>
          </div>
          <style>{`.nx-quick-modal{display:none}.nx-quick-modal:target{display:grid;position:fixed;inset:0;z-index:80;place-items:center;padding:1rem}.nx-quick-backdrop{position:absolute;inset:0;background:rgba(4,38,70,.55)}.nx-quick-panel{position:relative;width:min(34rem,100%);max-height:88vh;overflow:auto}.nx-quick-trigger{position:fixed;right:0;top:50%;z-index:40;display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 10px;border-radius:14px 0 0 14px;box-shadow:-4px 6px 22px rgba(4,38,70,.28);font-weight:800;font-size:15px;letter-spacing:.04em;text-decoration:none;transform:translateY(-50%);animation:nxQuickPulse 2.4s ease-out infinite}.nx-quick-trigger span{writing-mode:vertical-rl;transform:rotate(180deg)}.nx-quick-trigger svg{animation:nxQuickRing 1.6s ease-in-out infinite}.nx-quick-trigger:hover{padding-right:16px;animation-play-state:paused}@keyframes nxQuickPulse{0%{box-shadow:-4px 6px 22px rgba(4,38,70,.28),0 0 0 0 rgba(12,100,78,.55)}70%{box-shadow:-4px 6px 22px rgba(4,38,70,.28),0 0 0 16px rgba(12,100,78,0)}100%{box-shadow:-4px 6px 22px rgba(4,38,70,.28),0 0 0 0 rgba(12,100,78,0)}}@keyframes nxQuickRing{0%,60%,100%{transform:rotate(0)}10%,30%{transform:rotate(-14deg)}20%,40%{transform:rotate(14deg)}}@media(prefers-reduced-motion:reduce){.nx-quick-trigger,.nx-quick-trigger svg{animation:none}}@media(max-width:640px){.nx-quick-trigger{padding:12px 8px;font-size:14px}}`}</style>
        </>
      ) : null}
    </>
  );
}
