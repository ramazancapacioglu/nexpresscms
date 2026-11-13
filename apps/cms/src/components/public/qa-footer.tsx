import React from "react";
import { cookies } from "next/headers";
import { isPluginModuleEnabled, sanitizeQaState } from "@nexpress/core";
import type { Translator } from "@nexpress/i18n";
import { QA_PLUGIN_ID } from "@/plugins/qa";
import { qaCaptcha, readQa } from "@/lib/qa-store";

const NOTICE: Record<string, "qa.thanks" | "qa.captcha" | "qa.short" | "qa.rate" | "qa.voted" | "qa.error"> = {
  ok: "qa.thanks",
  captcha: "qa.captcha",
  short: "qa.short",
  rate: "qa.rate",
  voted: "qa.voted",
  err: "qa.error",
};

/**
 * Soru sayfasının altı: cevaplanmış ziyaretçi soruları, faydalı oyu ve soru formu.
 * Hepsi düz formdur; sayfaya istemci betiği eklenmez.
 */
export async function QaFooter({
  siteId,
  contentId,
  t,
  notice,
}: {
  siteId: string;
  contentId: string;
  t: Translator;
  notice?: string;
}) {
  const [ask, vote] = await Promise.all([
    isPluginModuleEnabled(siteId, QA_PLUGIN_ID, "ask"),
    isPluginModuleEnabled(siteId, QA_PLUGIN_ID, "vote"),
  ]);
  if (!ask && !vote) return null;
  const state = sanitizeQaState(await readQa(siteId, contentId));
  const jar = await cookies();
  const voted = (jar.get("nx_qav")?.value ?? "").split(",").includes(contentId);
  const captcha = ask ? qaCaptcha() : null;
  const note = notice && NOTICE[notice] ? t(NOTICE[notice]) : "";
  const faq = state.answered.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: state.answered.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }
    : null;

  return (
    <section className="mt-10 space-y-6 border-t border-nx-line pt-8" aria-label={t("qa.section")}>
      {faq ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} /> : null}
      {state.answered.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">{t("qa.answeredTitle")}</h2>
          {state.answered.map((item) => (
            <article key={item.id} className="rounded-lg border border-nx-line bg-nx-subtle p-4">
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed">{item.answer}</p>
              {item.name || item.date ? <p className="mt-2 text-xs text-nx-soft">{[item.name, item.date].filter(Boolean).join(" · ")}</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      {vote ? (
        <form method="post" action="/api/qa" className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="action" value="vote" />
          <input type="hidden" name="contentId" value={contentId} />
          <p className="text-sm font-medium">{voted ? t("qa.voted") : t("qa.helpful")}</p>
          <button type="submit" disabled={voted} className="rounded-full border border-nx-line px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {t("qa.votes", { n: state.upvotes })}
          </button>
        </form>
      ) : null}

      {ask && captcha ? (
        <form method="post" action="/api/qa" className="space-y-3 rounded-lg border border-nx-line p-4">
          <h2 className="text-base font-bold">{t("qa.askTitle")}</h2>
          <p className="text-sm text-nx-muted">{t("qa.askIntro")}</p>
          {note ? <p role="status" className="text-sm">{note}</p> : null}
          <input type="hidden" name="action" value="ask" />
          <input type="hidden" name="contentId" value={contentId} />
          <input type="hidden" name="captchaToken" value={captcha.token} />
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <label className="block text-sm">
            {t("qa.name")}
            <input name="name" maxLength={80} className="mt-1 w-full rounded border border-nx-line bg-transparent px-3 py-2" />
          </label>
          <label className="block text-sm">
            {t("qa.question")}
            <textarea name="question" required minLength={10} maxLength={500} rows={3} className="mt-1 w-full rounded border border-nx-line bg-transparent px-3 py-2" />
          </label>
          <label className="block text-sm">
            {t("qa.captchaLabel", { a: captcha.a, b: captcha.b })}
            <input name="captcha" required inputMode="numeric" className="mt-1 w-24 rounded border border-nx-line bg-transparent px-3 py-2" />
          </label>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{t("qa.send")}</button>
        </form>
      ) : null}
    </section>
  );
}
