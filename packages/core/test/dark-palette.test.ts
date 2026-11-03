import test from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, darkModeCss, deriveDarkColors, toCssVarTokens, type DesignTokens } from "../src";

const light: DesignTokens["colors"] = { primary: "#2563eb", primaryForeground: "#ffffff", secondary: "#0f172a", secondaryForeground: "#f8fafc", accent: "#4f46e5", accentForeground: "#ffffff", background: "#ffffff", foreground: "#09090b", muted: "#f1f5f9", mutedForeground: "#64748b", border: "#e2e8f0" };

test("kontrast oranı: bilinen değerler", () => {
  assert.ok(Math.abs(contrastRatio("#000000", "#ffffff") - 21) < 0.01);
  assert.equal(contrastRatio("#fff", "#fff"), 1);
  assert.equal(contrastRatio("red", "#fff"), 1); // ayrıştırılamayan → başarısız sayılır
});

test("türetilen karanlık palet WCAG AA (4.5) okunaklılığını sağlar", () => {
  for (const primary of ["#2563eb", "#059669", "#e11d48", "#111827", "#fde047"]) {
    const d = deriveDarkColors({ ...light, primary, accent: primary });
    assert.ok(contrastRatio(d.foreground, d.background) >= 7, "metin/arka plan");
    assert.ok(contrastRatio(d.mutedForeground, d.muted) >= 4.5, "soluk metin");
    assert.ok(contrastRatio(d.primary, d.background) >= 4.5, `bağlantı rengi ${primary}`);
    assert.ok(contrastRatio(d.primaryForeground, d.primary) >= 4.5, `düğme metni ${primary}`);
    assert.ok(contrastRatio(d.secondaryForeground, d.secondary) >= 4.5, "ikincil");
  }
});

test("geçersiz geçersiz kılma yok sayılır, geçerli olan uygulanır", () => {
  const d = deriveDarkColors(light, { background: "#101820", foreground: "javascript:x" as never });
  assert.equal(d.background, "#101820");
  assert.equal(d.foreground, "#e8eaed");
});

test("CSS değişkenli token'lar yedek değer taşır; karanlık CSS yalnızca değişkenleri değiştirir", () => {
  const t = toCssVarTokens({ colors: light, typography: {} as never, geometry: {} as never });
  assert.equal(t.colors.primary, "var(--nx-primary,#2563eb)");
  assert.equal(t.colors.border, "var(--nx-border,#e2e8f0)");
  const css = darkModeCss(light);
  assert.ok(css.includes("@media (prefers-color-scheme:dark)") && css.includes("--nx-bg:#0f1115"));
  assert.ok(!css.includes("<") && !css.includes("{{"));
});
