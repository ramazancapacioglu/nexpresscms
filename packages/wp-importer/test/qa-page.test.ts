import assert from "node:assert/strict";
import test from "node:test";
import { parseQaPage } from "../src/qa-page";

const CONTENT = "<div class=\"kb-row-layout-wrap kb-row-layout-id11375_9a0459-df alignnone wp-block-kadence-rowlayout\"><div class=\"kt-row-column-wrap kt-has-2-columns kt-row-layout-row kt-tab-layout-inherit kt-mobile-layout-row kt-row-valign-top\">\n\n<div class=\"wp-block-kadence-column kadence-column11375_66d459-6b\"><div class=\"kt-inside-inner-col\"><div class=\"wp-block-kadence-dynamichtml kb-dynamic-html kb-dynamic-html-id-11375_f19c18-0a kb-dynamic-html-link-style-none\">E-Fatura kesildiğini nasıl anlarız?</div>\n\n<div class=\"wp-block-kadence-dynamichtml kb-dynamic-html kb-dynamic-html-id-11375_f63293-7c\">E-Fatura kullanıcılarını doğrulamak için GİB’in sorgulama ekranı veya Akınsoft ERP’nin otomatik kontrol sistemi kullanılır. VKN/TCKN girilerek firmanın e-Fatura mükellefi olup olmadığı hızlıca görüntülenir ve hatalı belge kesiminin önüne geçilir.</div></div></div>\n\n\n\n<div class=\"wp-block-kadence-column kadence-column11375_e1253f-92\"><div class=\"kt-inside-inner-col\"><div class=\"wp-block-kadence-dynamichtml kb-dynamic-html kb-dynamic-html-id-11375_0706bd-14\">E-Fatura oluşturulduktan sonra entegratör ve GİB tarafından işlenen süreçte belgeye özel yanıt kodları üretilir.\r\nBu yanıtlar sayesinde faturanın başarılı şekilde kesilip kesilmediği anlaşılır.\r\n“Başarılı”, “Kabul Edildi”, “İletildi” gibi durumlar olumlu; “Hata”, “Red”, “Kabul Edilmedi” gibi durumlar olumsuzdur.\r\nAkınsoft Wolvox ERP, bu süreçleri otomatik takip ederek fatura listesinde durum günceller ve kullanıcıya bildirim verir.\r\nBu sayede kullanıcı, faturanın gönderiminin tamamlandığından emin olur.</div></div></div>\n\n</div></div>";
const PAGE = "<div class=\"ai-info-wrapper\">\n            <div class=\"ai-table-container\">\n                <table class=\"ai-detail-table\">\n                    <tbody>\n                        <tr><td>Hizmet Bölgesi:</td><td>TR</td></tr>                        <tr><td>Hedef Kitle:</td><td>İşletmeler, mali müşavirler, ön muhasebe personelleri</td></tr>                        <tr><td>Hakkında:</td><td>E-Fatura kullanıcı kontrolü ve GİB sorgulama yöntemleri</td></tr>                        <tr><td>Hizmet Tipi:</td><td>E-Dönüşüm bilgi içeriği</td></tr>                        <tr>\n                            <td>Detaylı Bilgi:</td>\n                            <td>\n                                                                    <a href=\"https://akinsoft.dijitalevre.com/e-fatura/\" class=\"ai-table-btn\" target=\"_blank\" rel=\"nofollow\">Ürünü İncele &rarr;</a>\n                                                            </td>\n                        </tr>\n                    </tbody>\n                </table>\n            </div>\n            <div class=\"ai-vote-card\">\n                <span class=\"ai-vote-title\" id=\"ai-vote-msg\">İçerik faydalı mı?</span>\n                <button id=\"ai-vote-btn\" class=\"ai-vote-btn-style \" data-post_id=\"11375\">\n                    <span class=\"dashicons dashicons-thumbs-up\" style=\"font-size:18px; width:18px; height:18px;\"></span>\n                    <span id=\"ai-vote-count\" class=\"ai-vote-count\">5</span>\n                </button>\n            </div>\n\n            \n                        ";

test("soru-cevap sayfası: soru, kısa cevap, ayrıntı satırları, künye, ürün bağlantısı ve oy ayrıştırılır", () => {
  const d = parseQaPage({ contentHtml: CONTENT, pageHtml: PAGE, origin: "https://akinsoft.dijitalevre.com" });
  assert.ok(d);
  assert.equal(d.question, "E-Fatura kesildiğini nasıl anlarız?");
  assert.match(d.shortAnswer, /^E-Fatura kullanıcılarını doğrulamak için/);
  assert.equal(d.detail.length, 5, "ayrıntı satır satır paragraf");
  assert.match(d.detail[0]!, /^E-Fatura oluşturulduktan sonra/);
  assert.equal(d.areaServed, "TR");
  assert.equal(d.audience, "İşletmeler, mali müşavirler, ön muhasebe personelleri");
  assert.equal(d.about, "E-Fatura kullanıcı kontrolü ve GİB sorgulama yöntemleri");
  assert.equal(d.serviceType, "E-Dönüşüm bilgi içeriği");
  assert.equal(d.productUrl, "/e-fatura", "aynı kök: göreli yol, sondaki eğik çizgi yok");
  assert.equal(d.upvotes, 5);
  assert.deepEqual(d.answered, []);
});

test("soru-cevap sayfası: soru ya da kısa cevap yoksa null", () => {
  assert.equal(parseQaPage({ contentHtml: "<p>x</p>", pageHtml: "", origin: "https://a.test" }), null);
});

test("soru-cevap sayfası: cevaplanmış ziyaretçi sorusu ve yabancı bağlantı", () => {
  const page = '<a href="https://baska.test/x/" class="ai-table-btn">i</a><div class="ai-qa-item"><div class="ai-qa-q">Lisans süresi nedir?</div><div class="ai-qa-a">Bir yıl.</div><div class="ai-qa-meta">Ali · 2 gün önce</div></div></div>';
  const d = parseQaPage({ contentHtml: '<div class="wp-block-kadence-dynamichtml a">Soru burada mı?</div><div class="wp-block-kadence-dynamichtml b">Evet burada.</div>', pageHtml: page, origin: "https://a.test" });
  assert.ok(d);
  assert.equal(d.productUrl, "https://baska.test/x/");
  assert.equal(d.answered[0]?.question, "Lisans süresi nedir?");
  assert.equal(d.answered[0]?.name, "Ali");
});
