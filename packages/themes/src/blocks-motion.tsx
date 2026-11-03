import React from "react";
import { ICON_PATHS, safeBlockDomId, type BlockNode } from "@nexpress/core";

const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);
const num = (v: unknown, d: number, min: number, max: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};
const colorOf = (v: unknown, d: string) => (typeof v === "string" && /^(#[0-9a-f]{3,8}|[a-z]{3,20}|var\(--[a-z0-9-]+\)|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i.test(v.trim()) ? v.trim() : d);
const href = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.startsWith("/") || s.startsWith("#") || /^https?:\/\//i.test(s) ? s : "";
};

const SHAPES: Record<string, string> = {
  wave: "M0,40 C240,100 480,0 720,40 C960,80 1200,0 1440,40 L1440,100 L0,100 Z",
  tilt: "M0,100 L1440,0 L1440,100 Z",
  curve: "M0,100 C480,0 960,0 1440,100 Z",
  triangle: "M0,100 L720,0 L1440,100 Z",
  slant: "M0,0 L1440,100 L0,100 Z",
};
export const SHAPE_NAMES = Object.keys(SHAPES);

/** Hareket/süs blokları: tamamı HTML+CSS'tir, istemci JS'i yoktur. `undefined` → bu dosyanın bloğu değil. */
export function renderMotionBlock(block: BlockNode): React.ReactElement | null | undefined {
  const p = block.props ?? {};
  const cls = `nx-${safeBlockDomId(block.id)}`;

  switch (block.type) {
    case "single_icon": {
      const path = ICON_PATHS[str(p.icon, "star")];
      const size = num(p.size, 40, 12, 160);
      const color = colorOf(p.color, "currentColor");
      const bg = colorOf(p.background, "");
      const link = href(p.href);
      const label = str(p.label);
      const svg = (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={num(p.stroke, 2, 1, 4)} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {path ? <path d={path} /> : null}
        </svg>
      );
      const wrap = (
        <span className="inline-flex items-center justify-center" style={bg ? { background: bg, padding: Math.round(size * 0.35), borderRadius: p.round === false ? 12 : 9999 } : undefined}>
          {svg}
        </span>
      );
      const body = link ? <a href={link} aria-label={label || undefined}>{wrap}</a> : wrap;
      return <div style={{ textAlign: p.align === "center" ? "center" : p.align === "right" ? "right" : "left" }}>{body}{label && !link ? <span className="sr-only">{label}</span> : null}</div>;
    }

    case "countup": {
      const to = Math.round(num(p.value, 100, -1e9, 1e9));
      const ms = Math.round(num(p.duration, 1.8, 0.2, 10) * 1000);
      const shown = to.toLocaleString("tr-TR");
      return (
        <div className={cls} style={{ textAlign: p.align === "left" ? "left" : p.align === "right" ? "right" : "center" }}>
          <div className="text-4xl font-black tabular-nums text-slate-900">
            {str(p.prefix)}<span className="nx-count" style={{ ["--nx-to" as string]: to }}>{shown}</span>{str(p.suffix)}
          </div>
          {str(p.label) ? <div className="mt-1 text-sm text-slate-600">{str(p.label)}</div> : null}
          <style>{`
            @property --nx-n{syntax:'<integer>';inherits:false;initial-value:0}
            @keyframes nx-count{to{--nx-n:var(--nx-to)}}
            @supports (animation-timeline:view()){
              .${cls} .nx-count{font-size:0;animation:nx-count ${ms}ms ease-out both;animation-timeline:view();animation-range:entry 0% cover 35%;counter-reset:nx-n var(--nx-n)}
              .${cls} .nx-count::before{content:counter(nx-n);font-size:2.25rem}
            }
          `}</style>
        </div>
      );
    }

    case "marquee": {
      const items = (Array.isArray(p.items) ? p.items : []).map((i) => (typeof i === "string" ? i : str((i as Record<string, unknown>)?.text))).filter(Boolean);
      if (!items.length) return null;
      const secs = Math.round(num(p.speed, 30, 5, 180));
      const reverse = p.direction === "right";
      const track = (hidden: boolean) => (
        <ul className="nx-mq-list" aria-hidden={hidden || undefined}>
          {items.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      );
      return (
        <div className={`${cls} nx-mq`} role="marquee" aria-label={str(p.label) || undefined}>
          <div className="nx-mq-track">{track(false)}{track(true)}</div>
          <style>{`
            .${cls}.nx-mq{overflow:hidden}
            .${cls} .nx-mq-track{display:flex;width:max-content;animation:nx-mq ${secs}s linear infinite${reverse ? " reverse" : ""}}
            .${cls}:hover .nx-mq-track{animation-play-state:${p.pauseOnHover === false ? "running" : "paused"}}
            .${cls} .nx-mq-list{display:flex;gap:3rem;padding-right:3rem;margin:0;list-style:none;white-space:nowrap;font-weight:700}
            @keyframes nx-mq{to{transform:translateX(-50%)}}
            @media (prefers-reduced-motion:reduce){.${cls} .nx-mq-track{animation:none;flex-wrap:wrap;width:auto}.${cls} .nx-mq-list[aria-hidden]{display:none}}
          `}</style>
        </div>
      );
    }

    case "shape_divider": {
      const d = SHAPES[str(p.shape, "wave")] ?? SHAPES.wave!;
      const h = num(p.height, 80, 20, 300);
      return (
        <div aria-hidden="true" style={{ lineHeight: 0, transform: p.flip ? "scaleY(-1)" : undefined }}>
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none" width="100%" height={h} style={{ display: "block" }}>
            <path d={d} fill={colorOf(p.color, "#0f172a")} />
          </svg>
        </div>
      );
    }

    default:
      return undefined;
  }
}
