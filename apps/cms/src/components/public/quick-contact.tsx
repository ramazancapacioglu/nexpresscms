import React from "react";
import { safeBlockDomId, type BlockNode, type DesignTokens } from "@nexpress/core";
import type { createTranslator } from "@nexpress/i18n";
import { RscBlockRenderer } from "@nexpress/themes";
import { createFormToken } from "@/lib/form-token";
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
  const block: BlockNode = { id: BLOCK_ID, type: "form_block", props: { formId: safeForm, title: "" } };
  const ctx = { forms, path, token: createFormToken(path), status: params.get("fb") === BLOCK_ID ? status : null, blockId: params.get("fb") ?? null } as const;
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
            style={{ backgroundColor: tokens.colors.secondary, color: tokens.colors.secondaryForeground, borderRadius: tokens.geometry.borderRadius }}
            className="nx-quick-trigger fixed bottom-20 right-4 z-40 px-4 py-2.5 text-sm font-bold shadow-lg ring-2 ring-white/70 transition hover:-translate-y-0.5"
          >
            {t("quick.callback")}
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
          <style>{`.nx-quick-modal{display:none}.nx-quick-modal:target{display:grid;position:fixed;inset:0;z-index:80;place-items:center;padding:1rem}.nx-quick-backdrop{position:absolute;inset:0;background:rgba(4,38,70,.55)}.nx-quick-panel{position:relative;width:min(34rem,100%);max-height:88vh;overflow:auto}@media(max-width:640px){.nx-quick-trigger{bottom:5rem;right:.75rem}}`}</style>
        </>
      ) : null}
    </>
  );
}
