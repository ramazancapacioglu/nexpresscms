
import type { ThemeStoreState } from "./use-theme-store";

/** SAĞ CANLI ÖNİZLEME KANVASI (7 Sütun) */
export function ThemeStorePreviewCanvas({ s }: { s: ThemeStoreState }) {
  const { tokens, customizer, previewDevice, btnRadius } = s;
  return (
    <>
      {/* SAĞ CANLI ÖNİZLEME KANVASI (7 Sütun) */}
      <div className="lg:col-span-7 flex flex-col">
        <div
          className={`mx-auto w-full transition-all duration-200 rounded-2xl border border-border shadow-md overflow-hidden ${
            previewDevice === "mobile"
              ? "max-w-[390px]"
              : previewDevice === "tablet"
                ? "max-w-[720px]"
                : "w-full"
          }`}
          style={{
            backgroundColor: tokens.colors.background,
            color: tokens.colors.foreground,
            fontFamily: tokens.typography.bodyFont,
          }}
        >
          {/* Canlı Önizleme Üst Barı */}
          <div
            style={{
              borderColor: tokens.colors.border,
              backgroundColor: tokens.colors.background,
            }}
            className="flex items-center justify-between border-b px-6 py-4"
          >
            <div className="flex items-center gap-2">
              <span
                style={{
                  backgroundColor: tokens.colors.primary,
                  color: tokens.colors.primaryForeground,
                  borderRadius: tokens.geometry.borderRadius,
                }}
                className="px-2.5 py-1 text-xs font-bold"
              >
                N
              </span>
              <span
                style={{ fontFamily: tokens.typography.headingFont }}
                className="font-bold text-sm"
              >
                NexPress Vitrin
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-5 text-xs font-medium opacity-80">
              <span>Mimari</span>
              <span>Çözümler</span>
              <span>Blog</span>
              <span
                style={{
                  backgroundColor: tokens.colors.primary,
                  color: tokens.colors.primaryForeground,
                  borderRadius: btnRadius,
                  textTransform: customizer.buttons.uppercase
                    ? "uppercase"
                    : "none",
                }}
                className="px-3.5 py-1.5 text-[11px] font-semibold"
              >
                Canlı Demo
              </span>
            </div>
          </div>

          {/* Canlı Önizleme Hero & Bento */}
          <div className="p-6 md:p-10 space-y-8">
            {customizer.pageTitle.showBreadcrumb && (
              <div
                style={{ color: tokens.colors.mutedForeground }}
                className="text-[11px] font-medium"
              >
                Ana Sayfa › Kurumsal Mimari ›{" "}
                <span style={{ color: tokens.colors.primary }}>
                  0-KB RSC & Görsel Stüdyo
                </span>
              </div>
            )}

            <div
              style={{
                backgroundColor: tokens.colors.secondary,
                color: tokens.colors.secondaryForeground,
                borderRadius: tokens.geometry.borderRadius,
              }}
              className="p-8 space-y-4"
            >
              <span
                style={{
                  backgroundColor: tokens.colors.primary,
                  color: tokens.colors.primaryForeground,
                }}
                className="inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              >
                CANLI TASARIM TOKEN ÖNİZLEMESİ
              </span>
              <h2
                style={{
                  fontFamily: tokens.typography.headingFont,
                  fontWeight: Number(customizer.typography.headingWeight),
                }}
                className="text-2xl md:text-3xl leading-tight"
              >
                Tasarım Tokenlarınız 0 KB İstemci JS İle Anında Ön Yüze Yansır
              </h2>
              <p className="text-xs md:text-sm opacity-85 leading-relaxed">
                Seçtiğiniz global renk paleti, yazı tipi ölçeği ve buton geometrisi saf CSS değişkenlerine derlenir.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  style={{
                    backgroundColor: tokens.colors.primary,
                    color: tokens.colors.primaryForeground,
                    borderRadius: btnRadius,
                    textTransform: customizer.buttons.uppercase
                      ? "uppercase"
                      : "none",
                  }}
                  className="px-5 py-2.5 text-xs font-semibold"
                >
                  Birincil Aksiyon
                </button>
                <button
                  type="button"
                  style={{
                    backgroundColor: tokens.colors.accent,
                    color: tokens.colors.accentForeground,
                    borderRadius: btnRadius,
                  }}
                  className="px-5 py-2.5 text-xs font-semibold"
                >
                  Vurgu Butonu (Accent)
                </button>
              </div>
            </div>

            {/* Kartlar Önizlemesi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Global Renk & Tipografi Sistemi",
                  desc: "Tek tıkla tüm sitedeki başlık, gövde ve yüzey renklerini değiştirin.",
                },
                {
                  title: "Düzen ve düğme geometrisi",
                  desc: `İçerik genişliği ${customizer.layout.articleWidth}, düğme yüksekliği ${customizer.buttons.paddingY}.`,
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: tokens.colors.muted,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.geometry.borderRadius,
                  }}
                  className="border p-5 space-y-2"
                >
                  <div
                    style={{
                      color: tokens.colors.primary,
                      fontFamily: tokens.typography.headingFont,
                      fontWeight: Number(customizer.typography.headingWeight),
                    }}
                    className="text-sm"
                  >
                    {card.title}
                  </div>
                  <p
                    style={{
                      color: tokens.colors.mutedForeground,
                      lineHeight: customizer.typography.bodyLineHeight,
                    }}
                    className="text-xs"
                  >
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
