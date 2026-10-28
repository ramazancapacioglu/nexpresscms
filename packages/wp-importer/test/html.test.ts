import test from "node:test";
import assert from "node:assert/strict";
import { convertWpHtml, toEmbedUrl } from "../src/html";

test("Gutenberg + klasik HTML: başlık, paragraf (satır içi biçim), liste, alıntı, kod, tablo, ayraç", () => {
  const r = convertWpHtml(`
    <!-- wp:heading --><h1>Ana <em>Başlık</em></h1><!-- /wp:heading -->
    <!-- wp:paragraph --><p>Merhaba <strong>dünya</strong>, bu bir <a href="/x">bağlantı</a> içeren yeterince uzun bir paragraf metnidir.</p><!-- /wp:paragraph -->
    <h3>Alt</h3><h5>En alt</h5>
    <ul><li>Bir</li><li>İki <b>kalın</b></li></ul><ol><li>Birinci</li></ol>
    <blockquote><p>Söz</p><cite>— Yazar</cite></blockquote>
    <pre class="wp-block-code"><code class="language-ts">const a = 1;\n</code></pre>
    <table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table><hr/>`);
  const t = r.blocks.map((b) => b.type);
  assert.deepEqual(t, ["heading", "paragraph", "heading", "heading", "list_element", "list_element", "quote", "code_block", "data_table", "divider_spacer"]);
  assert.deepEqual(r.blocks[0]!.props, { level: "h2", text: "Ana Başlık" });
  assert.equal((r.blocks[1]!.props as { html: string }).html.includes("<strong>dünya</strong>"), true);
  assert.deepEqual(r.blocks[2]!.props, { level: "h3", text: "Alt" });
  assert.equal((r.blocks[3]!.props as { level: string }).level, "h4");
  assert.deepEqual(r.blocks[4]!.props, { items: ["Bir", "İki kalın"], listType: "bullet", ordered: false });
  assert.equal((r.blocks[5]!.props as { ordered: boolean }).ordered, true);
  assert.deepEqual(r.blocks[6]!.props, { text: "Söz", author: "Yazar" });
  assert.deepEqual(r.blocks[7]!.props, { language: "ts", code: "const a = 1;" });
  assert.deepEqual(r.blocks[8]!.props, { headers: ["A", "B"], rows: [["1", "2"]] });
  assert.ok(r.firstParagraph.startsWith("Merhaba dünya"));
  assert.equal(r.strippedShortcodes, 4, "Gutenberg yorumları sayılır");
});

test("klasik editör: boş satırla ayrılmış düz metin paragraflara bölünür, tek satır sonu boşluk olur", () => {
  const r = convertWpHtml("Birinci satır\nikinci satır\n\nİkinci paragraf");
  assert.equal(r.blocks.length, 2);
  assert.equal((r.blocks[0]!.props as { text: string }).text, "Birinci satır ikinci satır");
});

test("görseller: figure+figcaption, paragraf içi img, tembel yükleme, veri URI atlanır, göreli adres çözülür", () => {
  const r = convertWpHtml(`<figure><img src="/a.jpg" alt="A" title="T"/><figcaption>Alt yazı</figcaption></figure>
    <p>Metin burada <img data-src="https://cdn.x/b.png" src="data:image/gif;base64,xx" alt="B"/> devam</p><p><img src="data:image/png;base64,AAA"/></p>`, { baseUrl: "https://eski.site/yazi/" });
  const imgs = r.blocks.filter((b) => b.type === "image_figure");
  assert.equal(imgs.length, 2);
  assert.deepEqual(imgs[0]!.props, { url: "https://eski.site/a.jpg", altText: "A", titleText: "T", caption: "Alt yazı" });
  assert.equal((imgs[1]!.props as { url: string }).url, "https://cdn.x/b.png");
  assert.deepEqual(r.images, ["https://eski.site/a.jpg", "https://cdn.x/b.png"]);
});

test("kısa kodlar: sayfa oluşturucu kodları atılır, caption korunur, bilinmeyenler bildirilir; embed ve iframe yalnızca YouTube/Vimeo", () => {
  const r = convertWpHtml(`[vc_row][vc_column]<p>Kalır</p>[/vc_column][/vc_row][caption id="x"]<img src="https://a.b/c.jpg" alt="c"/>Yazı[/caption][gallery ids="1,2"]
    [embed]https://www.youtube.com/watch?v=dQw4w9WgXcQ[/embed]
    <iframe src="https://player.vimeo.com/video/123456"></iframe><iframe src="https://evil.example/x"></iframe><script>alert(1)</script><style>p{}</style>`);
  assert.ok(r.strippedShortcodes >= 5);
  assert.ok(r.warnings.some((w) => w.includes("gallery")));
  assert.ok(r.warnings.some((w) => w.includes("iframe")));
  const videos = r.blocks.filter((b) => b.type === "video_embed").map((b) => (b.props as { url: string }).url);
  assert.deepEqual(videos, ["https://www.youtube.com/embed/dQw4w9WgXcQ", "https://player.vimeo.com/video/123456"]);
  assert.equal(JSON.stringify(r.blocks).includes("alert"), false);
  assert.ok(r.blocks.some((b) => b.type === "image_figure"));
});

test("güvenlik: olay öznitelikleri ve javascript: bağlantıları temizlenir; yabancı video adresi reddedilir", () => {
  const r = convertWpHtml(`<p onclick="x()">Bir <a href="javascript:alert(1)" onmouseover="y()">tıkla</a> <b style="color:red">kalın</b> metin ve yeterince uzun bir cümle olsun diye ekleme.</p>`);
  const html = (r.blocks[0]!.props as { html: string }).html;
  assert.equal(/onclick|onmouseover|javascript:|style=/i.test(html), false);
  assert.equal(toEmbedUrl("https://evil.example/watch?v=abcdefghijk"), null);
  assert.equal(toEmbedUrl("javascript:alert(1)"), null);
  assert.equal(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ"), "https://www.youtube.com/embed/dQw4w9WgXcQ");
});
