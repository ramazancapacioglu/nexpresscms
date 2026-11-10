import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { compileRichWpHtml, convertWpHtml, hasRichBlockMarkup } from "../src";

test("rich-layout: blok oluşturucu satırları, bilgi kartları, ikonlu listeler, kolajlar ve akordeonlar doğru derlenir", () => {
  const sampleHtml = `
    <style>
      .kb-row-layout-id100_hero > .kt-row-column-wrap { grid-template-columns: minmax(0, calc(65% - 1rem)) minmax(0, calc(35% - 1rem)); }
      .kb-row-layout-id100_cta > .kt-row-column-wrap { grid-template-columns: minmax(0, 1fr); }
      .kadence-column100_blue > .kt-inside-inner-col { background-color: #0b4b8a; }
      .kadence-column100_bgimg > .kt-inside-inner-col { background-image: url('https://www.akinsoftizmir.com.tr/wp-content/uploads/2024/08/akinsoft-e-donusum-03.webp'); }
    </style>
    <div id="hero" class="kb-row-layout-wrap kb-row-layout-id100_hero wp-block-kadence-rowlayout">
      <div class="kt-row-column-wrap kt-has-2-columns kt-row-layout-left-golden">
        <div class="wp-block-kadence-column kadence-column100_left">
          <div class="kt-inside-inner-col">
            <h1 class="wp-block-kadence-advancedheading">Türkiye'nin Yerli Yazılım Markası</h1>
            <p class="wp-block-kadence-advancedheading">İşletmeler için <strong>uçtan uca</strong> dijital dönüşüm.</p>
          </div>
        </div>
        <div class="wp-block-kadence-column kadence-column100_right">
          <div class="kt-inside-inner-col">
            <div class="kb-row-layout-wrap kb-row-layout-id100_collage wp-block-kadence-rowlayout">
              <div class="kt-row-column-wrap kt-has-2-columns kt-row-layout-equal">
                <div class="wp-block-kadence-column"><div class="kt-inside-inner-col"><figure class="wp-block-kadence-image"><img src="https://www.akinsoftizmir.com.tr/wp-content/uploads/2024/08/a1.webp" alt="Görsel 1" /></figure></div></div>
                <div class="wp-block-kadence-column"><div class="kt-inside-inner-col">
                  <figure class="wp-block-kadence-image"><img src="https://www.akinsoftizmir.com.tr/wp-content/uploads/2024/08/a2.webp" alt="Görsel 2" /></figure>
                  <figure class="wp-block-kadence-image"><img src="https://www.akinsoftizmir.com.tr/wp-content/uploads/2024/08/a3.webp" alt="Görsel 3" /></figure>
                </div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="kb-row-layout-wrap kb-row-layout-id100_cards wp-block-kadence-rowlayout">
      <div class="kt-row-column-wrap kt-has-3-columns kt-row-layout-equal">
        <div class="wp-block-kadence-column"><div class="kt-inside-inner-col">
          <div class="wp-block-kadence-infobox">
            <a class="kt-blocks-info-box-link-wrap" href="https://www.akinsoftizmir.com.tr/wolvox-erp">
              <div class="kt-blocks-info-box-media"><img src="https://www.akinsoftizmir.com.tr/wp-content/uploads/2024/08/erp.webp" alt="ERP" /></div>
              <h4 class="kt-blocks-info-box-title">Kurumsal Kaynak Planlama</h4>
              <p class="kt-blocks-info-box-text">Tüm süreçlerinizi tek merkezden yönetin.</p>
            </a>
          </div>
        </div></div>
        <div class="wp-block-kadence-column"><div class="kt-inside-inner-col">
          <div class="wp-block-kadence-infobox">
            <a class="kt-blocks-info-box-link-wrap" href="https://www.akinsoftizmir.com.tr/muhasebe-programlari">
              <h4 class="kt-blocks-info-box-title">Muhasebe Programları</h4>
              <p class="kt-blocks-info-box-text">Hızlı ve güvenilir finans yönetimi.</p>
            </a>
          </div>
        </div></div>
        <div class="wp-block-kadence-column"><div class="kt-inside-inner-col">
          <div class="wp-block-kadence-infobox">
            <a class="kt-blocks-info-box-link-wrap" href="https://www.akinsoftizmir.com.tr/akinsoft-e-donusum">
              <h4 class="kt-blocks-info-box-title">E-Dönüşüm Çözümleri</h4>
              <p class="kt-blocks-info-box-text">E-Fatura, E-Arşiv ve E-Defter entegrasyonu.</p>
            </a>
          </div>
        </div></div>
      </div>
    </div>
  `;

  assert.equal(hasRichBlockMarkup(sampleHtml), true);
  const res = convertWpHtml(sampleHtml, { baseUrl: "https://www.akinsoftizmir.com.tr" });
  assert.equal(res.blocks.length, 2);

  const heroSection = res.blocks[0]!;
  assert.equal(heroSection.type, "section");
  assert.equal(heroSection.props?.anchorId, "hero");
  const heroCols = heroSection.children?.[0]!;
  assert.equal(heroCols.type, "columns");
  assert.equal(heroCols.props?.layout, "8+4");
  const rightCol = heroCols.children?.[1]!;
  assert.equal(rightCol.children?.[0]?.type, "gallery");
  assert.equal(rightCol.children?.[0]?.props?.variant, "collage");

  const cardSection = res.blocks[1]!;
  assert.equal(cardSection.type, "section");
  const bento = cardSection.children?.[0]!;
  assert.equal(bento.type, "bento_features");
  assert.equal(bento.props?.columns, 3);
  const items = bento.props?.items as Array<Record<string, unknown>>;
  assert.equal(items.length, 3);
  assert.equal(items[0]?.title, "Kurumsal Kaynak Planlama");
  assert.equal(items[0]?.href, "/wolvox-erp");
});

test("rich-layout: taban adres yoksa göreli görsel müşteri alan adına bağlanmaz", () => {
  const html = `<div class="kb-row-layout-wrap wp-block-kadence-rowlayout"><div class="kt-row-column-wrap kt-has-1-columns"><div class="wp-block-kadence-column"><div class="kt-inside-inner-col"><img src="/wp-content/uploads/ornek.webp" alt="Örnek" /></div></div></div></div>`;
  const res = compileRichWpHtml(html);
  const urls = JSON.stringify(res.blocks);
  assert.equal(urls.includes("akinsoftizmir.com.tr"), false);
  assert.match(urls, /\/wp-content\/uploads\/ornek\.webp/);
});

test("rich-layout: tekrarlayan satır kimliği metni silip sabit düğme yazmaz", () => {
  const html = `
    <div class="kb-row-layout-wrap kb-row-layout-id6211_ornek has-theme-palette3-background-color wp-block-kadence-rowlayout">
      <div class="kt-row-column-wrap kt-has-1-columns">
        <div class="wp-block-kadence-column"><div class="kt-inside-inner-col">
          <h2>Demo kurulumu</h2>
          <p>Kısa açıklama metni burada.</p>
          <a class="kb-button" href="/demo">Demo Talebi</a>
          <a class="kb-button" href="/destek">Destek Talebi</a>
        </div></div>
      </div>
    </div>`;
  const res = compileRichWpHtml(html, { baseUrl: "https://ornek.site" });
  const flat = JSON.stringify(res.blocks);
  assert.equal(flat.includes("/akinsoft-demo-talebi"), false);
  assert.match(flat, /Demo Talebi/);
  assert.match(flat, /Destek Talebi/);
});

test("rich-layout: harita sorgusu yoksa genel konum metni kalır", () => {
  const html = `<div class="wp-block-kadence-googlemaps"><iframe src="https://maps.google.com/maps?output=embed"></iframe></div>`;
  const res = compileRichWpHtml(html);
  const map = res.blocks.find((block) => block.type === "map_embed");
  assert.equal(map?.props?.query, "Konum");
});

test("rich-layout: gerçek wp-content.json veri kümesindeki sayfalar taşmasız ve iç içe sütun kırmadan derlenir", () => {
  const datasetPath = path.resolve(process.cwd(), "../../docs/akinsoftizmir-com-tr-aktarim/public/data/wp-content.json");
  if (!fs.existsSync(datasetPath)) return;
  const data = JSON.parse(fs.readFileSync(datasetPath, "utf8"));

  for (const slug of ["akinsoft", "wolvox-erp", "otel-yonetimi-programi", "muhasebe-programlari", "iletisim"]) {
    const page = data.pages.find((p: { slug: string }) => p.slug === slug);
    assert.ok(page, `${slug} sayfası bulunmalı`);
    const res = compileRichWpHtml(page.content, { baseUrl: "https://www.akinsoftizmir.com.tr" });
    assert.ok(res.blocks.length >= 4, `${slug} en az 4 ana bölüm üretmeli`);

    // Hiçbir column içinde doğrudan başka bir columns veya section bulunmamalı
    const checkNoNestedColumnsInColumn = (nodes: typeof res.blocks, insideCol = false) => {
      for (const b of nodes) {
        if (insideCol && (b.type === "columns" || b.type === "section")) {
          assert.fail(`${slug}: column içinde ${b.type} olmamalı (${b.id})`);
        }
        if (b.children?.length) {
          checkNoNestedColumnsInColumn(b.children, insideCol || b.type === "column");
        }
      }
    };
    checkNoNestedColumnsInColumn(res.blocks);
  }
});

