import type { DesignTokens } from "@nexpress/core";

/**
 * Tema kartı için jetonlardan çizilen küçük site maketi: şerit, vitrin ve kartlar temanın gerçek renk, köşe ve yazı tipiyle.
 * Ekran görüntüsü olmayan resmi temalarda kart boş görünmez; sunucu tarafında saf CSS olarak çizilir.
 */
export function ThemePreviewMock({ tokens, name }: { tokens: DesignTokens; name: string }) {
  const c = tokens.colors;
  const radius = tokens.geometry.borderRadius;
  const heading = tokens.typography.headingFont;
  const dark = c.background.toLowerCase() === "#000000" || c.background.toLowerCase() === "#0a0a0a" || c.background.toLowerCase() === "#09090b";
  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ backgroundColor: c.background, color: c.foreground, fontFamily: tokens.typography.bodyFont }} aria-hidden="true">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
        <span className="truncate text-[9px] font-extrabold" style={{ fontFamily: heading }}>{name}</span>
        <span className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => <span key={i} className="h-[3px] w-5 rounded-full" style={{ backgroundColor: c.mutedForeground, opacity: 0.55 }} />)}
          <span className="h-2.5 w-7 rounded-sm" style={{ backgroundColor: c.primary, borderRadius: radius === "0px" ? 0 : 4 }} />
        </span>
      </div>
      <div className="mx-2.5 mt-2 flex-1 overflow-hidden px-3 py-2.5" style={{ backgroundColor: dark ? c.muted : c.secondary, color: c.secondaryForeground, borderRadius: radius }}>
        <span className="mb-1.5 inline-block h-1.5 w-10 rounded-full" style={{ backgroundColor: c.accent }} />
        <div className="text-[11px] font-extrabold leading-tight" style={{ fontFamily: heading }}>Başlığınız burada</div>
        <div className="mt-1 h-[3px] w-24 rounded-full opacity-60" style={{ backgroundColor: c.secondaryForeground }} />
        <div className="mt-0.5 h-[3px] w-16 rounded-full opacity-40" style={{ backgroundColor: c.secondaryForeground }} />
        <span className="mt-2 inline-block h-3 w-10" style={{ backgroundColor: c.primary, borderRadius: radius === "0px" ? 0 : 5 }} />
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="p-1.5" style={{ border: `1px solid ${c.border}`, backgroundColor: c.muted, borderRadius: radius }}>
            <span className="mb-1 block h-2 w-2 rounded-full" style={{ backgroundColor: i === 1 ? c.accent : c.primary }} />
            <span className="block h-[3px] w-full rounded-full" style={{ backgroundColor: c.mutedForeground, opacity: 0.5 }} />
            <span className="mt-0.5 block h-[3px] w-2/3 rounded-full" style={{ backgroundColor: c.mutedForeground, opacity: 0.35 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
