import assert from "node:assert/strict";
import test from "node:test";
import { buildFontFaceCss, fontFileName, fontStack, isFontFileName, keepFaces, parseGoogleFontCss, preloadFile, primaryFamily, resolveSiteSettings, sanitizeInstalledFonts } from "../src/index";

const CSS = `/* cyrillic */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/l/font?kit=aaa&v=v20) format('woff2');
  unicode-range: U+0400-045F;
}
/* latin-ext */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/l/font?kit=bbb&v=v20) format('woff2');
  unicode-range: U+0100-02BA, U+1E00-1EFF;
}
/* latin */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(https://fonts.gstatic.com/l/font?kit=ccc&v=v20) format('woff2');
  unicode-range: U+0000-00FF;
}
/* latin */
@font-face {
  font-family: 'Inter';
  font-style: italic;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/l/font?kit=ddd&v=v20) format('woff2');
}`;

test("Google CSS çözülür; yalnızca normal stil ve latin/latin-ext tutulur", () => {
  const all = parseGoogleFontCss(CSS);
  assert.equal(all.length, 4);
  const kept = keepFaces(all);
  assert.deepEqual(kept.map((f) => [f.subset, f.weight]), [["latin-ext", "400"], ["latin", "100 900"]]);
  assert.ok(kept[0]!.url.startsWith("https://fonts.gstatic.com/"));
});

test("font-family değeri yalnızca katalogdan; ad enjeksiyonu yok", () => {
  assert.equal(fontStack("Inter"), '"Inter", system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif');
  assert.equal(fontStack('Evil"; } body{display:none'), null);
  assert.equal(primaryFamily('"Plus Jakarta Sans", Inter, sans-serif'), "Plus Jakarta Sans");
  assert.equal(primaryFamily("Inter, system-ui"), "Inter");
});

test("dosya adı biçimi ve kayıt temizliği", () => {
  assert.equal(fontFileName("Plus Jakarta Sans", "3fa91c20"), "plus-jakarta-sans-3fa91c20.woff2");
  assert.ok(isFontFileName("inter-3fa91c20.woff2"));
  assert.ok(!isFontFileName("../etc/passwd"));
  assert.ok(!isFontFileName("inter-xyz.woff2"));
  const clean = sanitizeInstalledFonts([
    { family: "Inter", faces: [{ weight: "400", subset: "latin", file: "inter-3fa91c20.woff2", unicodeRange: "U+0000-00FF" }, { weight: "400", subset: "greek", file: "inter-3fa91c20.woff2", unicodeRange: "" }, { weight: "400", subset: "latin", file: "../x.woff2", unicodeRange: "" }] },
    { family: "Bilinmeyen", faces: [{ weight: "400", subset: "latin", file: "inter-3fa91c20.woff2", unicodeRange: "" }] },
  ]);
  assert.equal(clean.length, 1);
  assert.equal(clean[0]!.faces.length, 1);
});

test("@font-face üretimi, preload dosyası ve ayar çözümü", () => {
  const fonts = [{ family: "Inter", faces: [{ weight: "400", subset: "latin-ext" as const, file: "inter-aaaaaaaa.woff2", unicodeRange: "U+0100-02BA" }, { weight: "400", subset: "latin" as const, file: "inter-bbbbbbbb.woff2", unicodeRange: "U+0000-00FF" }] }];
  const css = buildFontFaceCss(fonts);
  assert.match(css, /font-display:swap/);
  assert.match(css, /src:url\(\/api\/fonts\/inter-bbbbbbbb\.woff2\) format\("woff2"\)/);
  assert.equal(preloadFile(fonts, "Inter"), "inter-bbbbbbbb.woff2");
  assert.equal(preloadFile(fonts, "Lora"), null);
  const settings = resolveSiteSettings({ customizer: { typography: { fonts } } });
  assert.equal(settings.customizer.typography.fonts?.length, 1);
  assert.deepEqual(resolveSiteSettings({}).customizer.typography.fonts, []);
});
