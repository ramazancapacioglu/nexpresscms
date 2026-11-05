import test from "node:test";
import assert from "node:assert/strict";
import { lintThemeTokens } from "../../core/src/ai-design/theme-lint";
import { blocksFromPublicHtml, readPublicShell } from "../src/shell";

const html = `<!doctype html><html><head>
<title>Akınsoft İzmir | Bayi</title>
<meta name="description" content="İzmir ana bayi">
<style>:root{--global-palette1:#0c644e;--global-palette2:#09589a;--global-palette3:#1a202c;--global-palette7:#fafafa;--global-palette8:#f7fafc;--global-palette9:#ffffff;}</style>
</head><body>
<header id="masthead" class="site-header"><a href="https://ornek.test/">Logo</a>
<a href="https://ornek.test/akinsoft-demo-talebi/">Demo Talebi</a>
<a href="https://ornek.test/iletisim/">İletişim</a>
<a href="tel:+902324251988">Ara</a></header>
<main><div class="entry-content single-content">
<div class="wp-block-kadence-rowlayout">
<h1>Türkiye'nin yerli yazılım markası</h1>
<p>Kurulum ve destek aynı ekipte.</p>
</div>
<h2>Çözümler</h2>
<div class="wp-block-kadence-rowlayout">
<div class="wp-block-kadence-infobox"><a href="https://ornek.test/muhasebe-programlari/"><div class="kt-blocks-info-box-title">Muhasebe</div><p class="kt-blocks-info-box-text">Ön muhasebe</p></a></div>
<div class="wp-block-kadence-infobox"><a href="https://ornek.test/wolvox-erp/"><div class="kt-blocks-info-box-title">ERP</div><p class="kt-blocks-info-box-text">Kaynak planlama</p></a></div>
</div>
<div class="wp-block-kadence-accordion">
<div class="kt-accordion-pane"><span class="kt-blocks-accordion-title">Neden burada?</span><div class="kt-accordion-panel"><p>Kurulum günü oradayız.</p></div></div>
<div class="kt-accordion-pane"><span class="kt-blocks-accordion-title">Demo ücretli mi?</span><div class="kt-accordion-panel"><p>Demo kurulumu ücretsizdir.</p></div></div>
</div>
<p>Bayi kodu BA35022.</p>
</div></main>
<footer id="colophon" class="site-footer"><div class="footer-widget-area"><a href="https://ornek.test/iletisim/">İletişim</a><a href="https://ornek.test/hakkimizda/">Hakkımızda</a></div></footer>
</body></html>`;

test("kabuk: palet jetonu, menü, vitrin, kart ve SSS üretir; CSS kopyalanmaz", () => {
  const shell = readPublicShell(html, "https://ornek.test/", "tr");
  assert.equal(shell.tokens.colors.primary, "#0c644e");
  assert.equal(shell.tokens.colors.accent, "#09589a");
  assert.equal(lintThemeTokens(shell.tokens).ok, true);
  assert.equal(shell.header.mainBar.ctaHref, "/tr/akinsoft-demo-talebi");
  assert.equal(shell.menu.some((m) => m.href === "/tr/iletisim"), true);
  assert.equal(shell.blocks[0]!.type, "hero");
  assert.equal(shell.blocks.some((b) => b.type === "bento_features"), true);
  assert.equal(shell.blocks.some((b) => b.type === "faq_accordion"), true);
  assert.equal(JSON.stringify(shell).includes("<style"), false);
  assert.equal(shell.footer.columns.length, 1);
  const again = blocksFromPublicHtml(html, "https://ornek.test/", "tr");
  assert.equal(again.blocks.filter((b) => b.type === "bento_features").length, 1);
});
