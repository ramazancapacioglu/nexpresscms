import React from "react";
import type { DesignTokens } from "@nexpress/core";

type Props = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function renderInkHero(p: Props, tokens: DesignTokens): React.ReactElement {
  const command = str(p.command);
  return (
    <section
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
      className="grid border-b border-white/15 lg:grid-cols-2"
    >
      <div className="flex flex-col justify-end border-white/15 px-6 pb-8 pt-16 sm:px-10 lg:border-r lg:px-14 lg:pb-12">
        <h1
          style={{
            fontFamily: tokens.typography.headingFont,
            fontSize: "clamp(3.4rem, 6.4vw, 5.75rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.045em",
            fontWeight: 600,
          }}
          className="max-w-xl text-white"
        >
          {str(p.title)}
        </h1>
        {str(p.subtitle) ? (
          <p className="mt-6 max-w-md text-sm leading-relaxed text-zinc-300">{str(p.subtitle)}</p>
        ) : null}
        <div className="mt-10 border-t border-white/15">
          {command ? (
            <a
              href={str(p.commandHref) || "#"}
              style={{ fontFamily: tokens.typography.monoFont }}
              className="flex items-center justify-between border-b border-white/15 px-1 py-4 text-sm text-white"
            >
              <span>$ {command}</span>
              <span aria-hidden>↗</span>
            </a>
          ) : null}
          {str(p.primaryCtaLabel) ? (
            <a
              href={str(p.primaryCtaHref) || "#"}
              className="flex items-center justify-between px-1 py-4 text-sm font-medium text-white"
            >
              <span>{str(p.primaryCtaLabel)}</span>
              <span aria-hidden>→</span>
            </a>
          ) : null}
        </div>
      </div>
      <div className="hidden min-h-64 border-white/10 lg:block" />
    </section>
  );
}

export function renderInkNames(p: Props): React.ReactElement {
  const stats = Array.isArray(p.stats) ? p.stats : [];
  return (
    <section className="grid grid-cols-2 border-b border-white/15 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((st, idx) => {
        const row = st as { value?: unknown };
        return (
          <div
            key={idx}
            className="border-b border-r border-white/15 px-4 py-6 text-center text-xs font-medium tracking-wide text-nx-muted last:border-r-0"
          >
            {str(row?.value)}
          </div>
        );
      })}
    </section>
  );
}

export function renderInkBento(p: Props, tokens: DesignTokens): React.ReactElement {
  const items = Array.isArray(p.items) ? p.items : [];
  return (
    <section className="border-b border-white/15">
      {str(p.title) ? (
        <h2
          style={{ fontFamily: tokens.typography.headingFont }}
          className="max-w-3xl px-6 py-12 text-3xl font-semibold tracking-tight text-white sm:px-10 sm:text-5xl"
        >
          {str(p.title)}
        </h2>
      ) : null}
      <div className="grid border-t border-white/15 md:grid-cols-2">
        {items.map((item, idx) => {
          const row = item as { title?: unknown; description?: unknown };
          return (
            <article key={idx} className="border-b border-r border-white/15 px-6 py-8 sm:px-10">
              <h3 className="text-lg font-medium text-white">{str(row?.title)}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">{str(row?.description)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function renderInkQuotes(p: Props, tokens: DesignTokens): React.ReactElement {
  const items = Array.isArray(p.items) ? p.items : [];
  return (
    <section className="border-b border-white/15">
      {str(p.title) ? (
        <h2
          style={{ fontFamily: tokens.typography.headingFont }}
          className="px-6 py-12 text-3xl font-semibold tracking-tight text-white sm:px-10 sm:text-4xl"
        >
          {str(p.title)}
        </h2>
      ) : null}
      <div className="grid border-t border-white/15 md:grid-cols-3">
        {items.map((item, idx) => {
          const row = item as { quote?: unknown; author?: unknown; role?: unknown };
          return (
            <blockquote key={idx} className="border-b border-r border-white/15 px-6 py-8 sm:px-8">
              <p className="text-lg font-medium leading-snug text-white">“{str(row?.quote)}”</p>
              <footer className="mt-6 text-xs text-nx-muted">
                {str(row?.author)}
                {str(row?.role) ? ` — ${str(row.role)}` : ""}
              </footer>
            </blockquote>
          );
        })}
      </div>
    </section>
  );
}

export function renderInkFaq(p: Props, tokens: DesignTokens): React.ReactElement {
  const items = Array.isArray(p.items) ? p.items : [];
  return (
    <section className="grid border-b border-white/15 lg:grid-cols-2">
      <div className="border-b border-white/15 px-6 py-12 sm:px-10 lg:border-b-0 lg:border-r">
        <h2
          style={{ fontFamily: tokens.typography.headingFont }}
          className="text-3xl font-semibold tracking-tight text-white sm:text-5xl"
        >
          {str(p.title) || "Sorular"}
        </h2>
      </div>
      <div>
        {items.map((item, idx) => {
          const row = item as { question?: unknown; answer?: unknown };
          return (
            <details key={idx} open={idx === 0} className="group border-b border-white/15 px-6 py-5 sm:px-8">
              <summary className="cursor-pointer list-none text-sm font-medium text-white">
                {str(row?.question)}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{str(row?.answer)}</p>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function renderInkCta(p: Props, tokens: DesignTokens): React.ReactElement {
  return (
    <section className="grid border-b border-white/15 lg:grid-cols-2">
      <div className="px-6 py-16 sm:px-10">
        <h2
          style={{ fontFamily: tokens.typography.headingFont }}
          className="max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl"
        >
          {str(p.title)}
        </h2>
        {str(p.subtitle) ? (
          <p className="mt-4 max-w-md text-sm text-zinc-400">{str(p.subtitle)}</p>
        ) : null}
      </div>
      <div className="flex items-end border-t border-white/15 lg:border-l lg:border-t-0">
        {str(p.buttonLabel) ? (
          <a
            href={str(p.buttonHref) || "#"}
            className="flex w-full items-center justify-between px-6 py-6 text-sm font-medium text-white sm:px-10"
          >
            <span>{str(p.buttonLabel)}</span>
            <span aria-hidden>→</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
