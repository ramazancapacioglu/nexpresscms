import type { SiteCustomizerSettings } from "@nexpress/core";

const PATHS = {
  arrow: "M12 19V5M6 11l6-6 6 6",
  chevron: "M6 14l6-6 6 6",
  corner: "M8 16V8h8M8 8l8 8",
} as const;

/** Sayfanın başına giden bağlantı. Kaydırma tarayıcının kendi işidir. */
export function BackToTop({ settings, label }: { settings: SiteCustomizerSettings["backToTop"]; label: string }) {
  if (!settings.enabled) return null;
  const px = settings.size === "sm" ? 40 : settings.size === "lg" ? 56 : 48;
  return (
    <a
      href="#nx-top"
      aria-label={label}
      style={{
        [settings.position]: 16,
        bottom: 16,
        width: px,
        height: px,
        backgroundColor: settings.color,
      }}
      className="fixed z-40 inline-flex items-center justify-center rounded-full text-white shadow-md"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={PATHS[settings.icon]} />
      </svg>
    </a>
  );
}
