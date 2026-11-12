import React from "react";
import { cookies } from "next/headers";
import {
  contentAccessCookieName,
  evaluateContentAccess,
  verifyContentAccessToken,
  type ContentAccessDecision,
  type ContentStatus,
  type ContentVisibility,
  type DesignTokens,
} from "@nexpress/core";
import type { Translator } from "@nexpress/i18n";
import { getAuthSecret } from "@/lib/auth/config";
import { Link } from "./link";

export async function checkVisitorContentAccess(input: {
  siteId: string;
  contentId: string;
  status: ContentStatus;
  visibility: ContentVisibility;
  accessPassword?: string;
  hasSession: boolean;
  hasMemberSession?: boolean;
  isDraftPreview?: boolean;
}): Promise<ContentAccessDecision> {
  const pwd = (input.accessPassword ?? "").trim();
  let hasValidPasswordToken = false;
  if (pwd && !input.hasSession && !input.isDraftPreview) {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(contentAccessCookieName(input.contentId))?.value;
    hasValidPasswordToken = await verifyContentAccessToken(
      getAuthSecret(),
      input.siteId,
      input.contentId,
      pwd,
      rawToken
    );
  }
  return evaluateContentAccess({
    status: input.status,
    visibility: input.visibility,
    accessPassword: pwd,
    hasSession: input.hasSession,
    hasMemberSession: input.hasMemberSession,
    hasValidPasswordToken,
    isDraftPreview: input.isDraftPreview,
  });
}

/**
 * 0-KB RSC Parola / Üye Korumalı İçerik Kapısı (İstemci JS'i içermez).
 */
export function ContentAccessGate({
  gate,
  contentId,
  locale,
  slug,
  pagePath,
  title,
  tokens,
  t,
  hasError,
  memberLoginHref,
}: {
  gate: "password" | "members_only";
  /** Üyelik açıksa ziyaretçi üye girişi adresi; yoksa panel girişi gösterilir. */
  memberLoginHref?: string;
  contentId: string;
  locale: string;
  slug: string;
  pagePath: string;
  title: string;
  tokens: DesignTokens;
  t: Translator;
  hasError?: boolean;
}) {
  return (
    <section
      style={{ borderRadius: tokens.geometry.borderRadius }}
      className="mx-auto my-8 max-w-lg border border-nx-line bg-nx-card p-6 sm:p-8 shadow-xs space-y-5"
    >
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800">
          🔒 {gate === "password" ? t("content.passwordTitle") : t("content.membersOnlyTitle")}
        </span>
        <h1
          style={{ fontFamily: tokens.typography.headingFont }}
          className="text-2xl font-bold text-nx-fg"
        >
          {title}
        </h1>
        <p className="text-sm text-nx-soft leading-relaxed">
          {gate === "password" ? t("content.passwordBody") : t("content.membersOnlyBody")}
        </p>
      </div>

      {gate === "password" ? (
        <form action="/api/content-access" method="post" className="space-y-4">
          <input type="hidden" name="contentId" value={contentId} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slug" value={slug} />
          <div className="space-y-1.5">
            <label htmlFor="nx-content-password" className="block text-xs font-semibold text-nx-fg">
              {t("content.passwordLabel")}
            </label>
            <input
              id="nx-content-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-nx-line bg-nx-bg px-3.5 py-2 text-sm text-nx-fg outline-none focus:ring-2"
            />
          </div>
          {hasError ? (
            <p role="alert" className="text-xs font-medium text-red-600">
              {t("content.passwordError")}
            </p>
          ) : null}
          <button
            type="submit"
            style={{
              backgroundColor: tokens.colors.primary,
              color: tokens.colors.primaryForeground,
              borderRadius: tokens.geometry.borderRadius,
            }}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold transition hover:opacity-95"
          >
            {t("content.passwordButton")}
          </button>
        </form>
      ) : (
        <div>
          <a
            href={memberLoginHref ?? `/login?next=${encodeURIComponent(pagePath)}`}
            style={{
              backgroundColor: tokens.colors.primary,
              color: tokens.colors.primaryForeground,
              borderRadius: tokens.geometry.borderRadius,
            }}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold transition hover:opacity-95"
          >
            {memberLoginHref ? t("content.membersOnlyMemberCta") : t("content.membersOnlyCta")}
          </a>
        </div>
      )}
    </section>
  );
}

/**
 * 0-KB RSC Sosyal Paylaşım ve Markdown Çubuğu.
 */
export function ContentShareBar({
  title,
  pageUrl,
  markdownHref,
  borderRadius,
  shareHeading,
}: {
  title: string;
  pageUrl: string;
  markdownHref: string;
  borderRadius: string;
  shareHeading: string;
}) {
  return (
    <section
      style={{ borderRadius }}
      className="border border-nx-line bg-nx-subtle p-5 flex flex-wrap items-center justify-between gap-4"
    >
      <div className="space-y-0.5">
        <div className="text-xs font-bold uppercase tracking-wider text-nx-muted">
          {shareHeading}
        </div>
        <div className="text-sm font-semibold text-nx-fg">{title}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(pageUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-nx-line bg-nx-card px-3.5 py-2 text-nx-fg hover:bg-nx-subtle"
        >
          𝕏 (Twitter)
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-nx-line bg-nx-card px-3.5 py-2 text-nx-fg hover:bg-nx-subtle"
        >
          LinkedIn
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(title + " " + pageUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-nx-line bg-nx-card px-3.5 py-2 text-nx-fg hover:bg-nx-subtle"
        >
          WhatsApp
        </a>
        <Link
          href={markdownHref}
          className="rounded-lg bg-slate-900 px-3.5 py-2 text-white hover:bg-slate-800 font-mono"
        >
          Markdown (.md)
        </Link>
      </div>
    </section>
  );
}

