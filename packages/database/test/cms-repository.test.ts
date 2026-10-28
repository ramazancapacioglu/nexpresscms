import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import type { BlockNode } from "@nexpress/core";
import { createTempPgDatabase } from "./helpers/pg-temp";

/**
 * ScopedCmsRepository karakterizasyon testleri: refactor'dan önce ve sonra aynı davranışı sabitler.
 * Seed'li veritabanında çalışır; DB_TEST_PG_URL (sunucu adresi) ile PostgreSQL'e karşı da koşar.
 */
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "nx-cms-"));
const tempPg = await createTempPgDatabase();
const env = tempPg
  ? { ...process.env, DB_DIALECT: "postgresql", DATABASE_URL: tempPg.url }
  : { ...process.env, DB_DIALECT: "sqlite", SQLITE_URL: `file:${path.join(dbDir, "t.db")}` };
Object.assign(process.env, env);

const pkg = path.resolve(import.meta.dirname, "..");
const tsx = path.resolve(pkg, "../../node_modules/.bin/tsx");
let repo: ReturnType<typeof import("../src/repository").getScopedRepository>;
let other: typeof repo;

before(async () => {
  for (const s of ["migrate.ts", "seed.ts"]) execFileSync(tsx, [`src/scripts/${s}`], { cwd: pkg, env, stdio: "pipe" });
  const mod = await import("../src/repository");
  repo = mod.getScopedRepository("default");
  other = mod.getScopedRepository("baska-site");
});
after(async () => {
  fs.rmSync(dbDir, { recursive: true, force: true });
  await tempPg?.drop();
});

const para = (id: string, text: string): BlockNode => ({ id, type: "paragraph", props: { text } });
const baseInput = (over: Record<string, unknown> = {}) => ({
  type: "post" as const,
  locale: "tr",
  slug: "karakter-testi",
  title: "Karakter Testi",
  tldr: "Kısa bir özet cümlesi.",
  blocks: [para("p1", "İlk paragraf metni burada yer alır.")],
  ...over,
});

test("site: seed edilmiş site okunur, başka kiracı boştur", async () => {
  const site = await repo.getSite();
  assert.ok(site);
  assert.equal(site.siteId, "default");
  assert.equal(site.defaultLocale, "tr");
  assert.deepEqual(site.supportedLocales, ["tr"]);
  assert.ok(site.settings.seo.titleTemplate.length > 0);
  assert.equal(await other.getSite(), null);
});

test("site ayarları: kısmi yama birleştirilir ve kalıcıdır", async () => {
  const before = (await repo.getSite())!.settings;
  const saved = await repo.saveSiteSettings({ seo: { separator: "·" }, general: { contactEmail: "a@b.co", timezone: "Europe/Berlin" }, customizer: { customCss: ".x{color:red}" } });
  assert.equal(saved.seo.separator, "·");
  assert.equal(saved.seo.titleTemplate, before.seo.titleTemplate, "dokunulmayan alan korunur");
  const again = (await repo.getSite())!.settings;
  assert.equal(again.general.contactEmail, "a@b.co");
  assert.equal(again.general.timezone, "Europe/Berlin");
  assert.equal(again.customizer.customCss, ".x{color:red}");
  assert.equal(again.customizer.typography.headingFont, before.customizer.typography.headingFont);
});

test("tema etkinleştirme: aktif tema ve token kalıcı olur, kurulu tema listesi etkinliği yansıtır", async () => {
  const site = (await repo.getSite())!;
  const tokens = { ...site.designTokens, colors: { ...site.designTokens.colors, primary: "#123456" } };
  await repo.activateTheme("commerce-velocity", tokens, "ecommerce");
  const after = (await repo.getSite())!;
  assert.equal(after.activeThemeId, "commerce-velocity");
  assert.equal(after.designTokens.colors.primary, "#123456");
  assert.equal(after.siteProfile, "ecommerce");
  const themes = await repo.listInstalledThemes();
  assert.ok(themes.some((t) => t.themeId === "commerce-velocity"));
  assert.equal(themes.filter((t) => t.isActive).length, 1, "tek aktif tema");
  assert.equal(themes.find((t) => t.isActive)!.themeId, "commerce-velocity");
});

test("navigasyon: yeni dil oluşturulur, var olan güncellenir, diller ayrıdır", async () => {
  const seeded = await repo.getNavigationLayout("tr");
  assert.ok(seeded);
  assert.equal(await repo.getNavigationLayout("de"), null);
  await assert.rejects(repo.saveNavigationLayout({ locale: "de", menuItems: [] }), /Header kaydı yok/, "yeni dil için header şarttır");
  await repo.saveNavigationLayout({ locale: "de", headerConfig: seeded.headerConfig, menuItems: [{ id: "m1", label: "Start", href: "/de" } as never] });
  const de = (await repo.getNavigationLayout("de"))!;
  assert.equal(de.menuItems.length, 1);
  await repo.saveNavigationLayout({ locale: "de", menuItems: [] });
  assert.equal((await repo.getNavigationLayout("de"))!.menuItems.length, 0);
  assert.equal(de.id, (await repo.getNavigationLayout("de"))!.id, "aynı satır güncellenir");
  assert.equal((await repo.getNavigationLayout("tr"))!.id, seeded.id, "diğer dil etkilenmez");
});

let createdId = "";

test("içerik: kaydet, oku, listele (durum süzgeci), markdown ve skor üret", async () => {
  const res = await repo.saveContent(baseInput({ status: "published" }));
  createdId = res.contentId;
  assert.ok(createdId);
  assert.match(res.markdownCache, /Karakter Testi/);
  assert.match(res.markdownCache, /İlk paragraf metni/);
  assert.equal(typeof res.seoScore, "number");
  const byId = (await repo.getContentById(createdId, "tr"))!;
  assert.equal(byId.slug, "karakter-testi");
  assert.equal(byId.status, "published");
  assert.equal(byId.tldr, "Kısa bir özet cümlesi.");
  assert.equal((await repo.getContentBySlug("karakter-testi", "tr"))!.id, createdId);
  assert.ok((await repo.listContents({ locale: "tr", status: "published" })).some((c) => c.id === createdId));
  assert.ok(!(await repo.listContents({ locale: "tr", status: "draft" })).some((c) => c.id === createdId));
  assert.ok((await repo.listContents({ locale: "tr", type: "post" })).every((c) => c.type === "post"));
  assert.equal(await other.getContentById(createdId, "tr"), null, "başka kiracı göremez");
});

test("içerik: slug değişince eski adres yönlendirme olarak çözülür", async () => {
  await repo.saveContent(baseInput({ contentId: createdId, slug: "yeni-adres", status: "published" }));
  const fresh = await repo.resolveContentBySlug("yeni-adres", "tr");
  assert.equal(fresh?.isRedirect, false);
  const old = await repo.resolveContentBySlug("karakter-testi", "tr");
  assert.equal(old?.isRedirect, true);
  assert.equal(old?.content.slug, "yeni-adres");
  assert.equal(await repo.resolveContentBySlug("hic-yok", "tr"), null);
});

test("içerik: patch durum, noindex, kategori/etiket ekle-çıkar uygular", async () => {
  await repo.patchContent(createdId, { status: "draft", noIndex: true, title: "Yama Başlık", categories: ["a"], addCategories: ["b"], tags: ["x", "y"], removeTags: ["x"] });
  const c = (await repo.getContentById(createdId, "tr"))!;
  assert.equal(c.status, "draft");
  assert.equal(c.noIndex, true);
  assert.equal(c.title, "Yama Başlık");
  const pub = (await import("@nexpress/core")).resolvePublishing(c.schemaAttributes);
  assert.deepEqual([...pub.categories].sort(), ["a", "b"]);
  assert.deepEqual(pub.tags, ["y"]);
});

test("içerik: çoğalt yeni kimlik ve farklı slug üretir; çeviriler listelenir; sil kalıcıdır", async () => {
  const copyId = await repo.duplicateContent(createdId, "tr");
  assert.ok(copyId && copyId !== createdId);
  const copy = (await repo.getContentById(copyId!, "tr"))!;
  assert.notEqual(copy.slug, "yeni-adres");
  assert.deepEqual((await repo.getTranslationsForContent(createdId)).map((t) => t.locale), ["tr"]);
  assert.equal(await repo.duplicateContent("yok-boyle-id", "tr"), null);
  assert.equal(await repo.deleteContents([copyId!, createdId]), 2);
  assert.equal(await repo.getContentById(createdId, "tr"), null);
  assert.equal(await repo.deleteContents([]), 0);
  assert.ok(Array.isArray(await repo.listEntityLinks()));
});

test("taksonomi: oluştur, türe göre listele, silince çocuklar üst kategoriye taşınır", async () => {
  const parent = await repo.saveTaxonomy({ taxonomyType: "category", slug: "ust", name: "Üst" });
  const child = await repo.saveTaxonomy({ taxonomyType: "category", slug: "alt", name: "Alt", parentId: parent.id, sortOrder: 2 });
  await repo.saveTaxonomy({ taxonomyType: "tag", slug: "etiket", name: "Etiket" });
  const cats = await repo.listTaxonomies("category");
  assert.ok(cats.every((t) => t.taxonomyType === "category"));
  assert.equal(cats.find((t) => t.id === child.id)!.parentId, parent.id);
  const updated = await repo.saveTaxonomy({ id: parent.id, taxonomyType: "category", slug: "ust", name: "Üst (yeni)" });
  assert.equal(updated.name, "Üst (yeni)");
  assert.equal((await repo.deleteTaxonomy(parent.id)).deletedId, parent.id);
  const after = await repo.listTaxonomies("category");
  assert.ok(!after.some((t) => t.id === parent.id));
  assert.equal(after.find((t) => t.id === child.id)!.parentId, null, "çocuk üst kategorinin üstüne (kök) taşınır");
  assert.equal((await other.listTaxonomies()).length, 0);
});

test("medya: oluştur, güncelle, skor hesapla, listele ve kiracıya göre ayır", async () => {
  const m = await repo.saveMediaAsset({ id: "med_cms_test", filename: "a.jpg", url: "/media/med_cms_test?w=10&h=10", altText: "uzun bir alt metin burada", titleText: "Başlık", caption: "Alt yazı" });
  assert.equal(m.seoScore, 100);
  const m2 = await repo.saveMediaAsset({ id: "med_cms_test", filename: "a.jpg", url: m.url, altText: "kısa" });
  assert.equal(m2.seoScore, 20);
  const list = await repo.listMediaAssets();
  assert.equal(list.filter((x) => x.id === "med_cms_test").length, 1, "aynı kimlik güncellenir, çoğalmaz");
  assert.equal(list.find((x) => x.id === "med_cms_test")!.altText, "kısa");
  assert.equal((await other.listMediaAssets()).length, 0);
});

test("yorum/inceleme: kaydet, içeriğe göre listele, kiracıya göre ayır", async () => {
  const content = (await repo.listContents({ locale: "tr", status: "published" }))[0]!;
  const r = await repo.saveCommentReview({ contentId: content.contentId, authorName: "Ali", entryType: "review", rating: 4, body: "Güzel", pros: ["hızlı"], cons: [], status: "approved" });
  assert.equal(r.rating, 4);
  const list = await repo.listCommentsReviews(content.contentId);
  assert.ok(list.some((x) => x.id === r.id && x.authorName === "Ali" && x.pros.includes("hızlı")));
  assert.equal((await other.listCommentsReviews(content.contentId)).length, 0);
});

test("kiracı yalıtımı: başka kiracı aynı kimlikle taksonomi, medya, yorum ve içerik yazarak satırı ele geçiremez", async () => {
  const taxonomy = await repo.saveTaxonomy({ taxonomyType: "category", slug: "korumali", name: "A'nın kategorisi" });
  await other.saveTaxonomy({ id: taxonomy.id, taxonomyType: "category", slug: "hijack", name: "ELE GEÇİRİLDİ" });
  assert.equal((await repo.listTaxonomies("category")).find((t) => t.id === taxonomy.id)!.name, "A'nın kategorisi");
  assert.equal((await other.listTaxonomies()).length, 0, "başka kiracıda hiç satır oluşmaz");

  await repo.saveMediaAsset({ id: "med_iso_test", filename: "a.jpg", url: "/media/med_iso_test?w=1&h=1", altText: "A'nın görseli" });
  await other.saveMediaAsset({ id: "med_iso_test", filename: "hijack.jpg", url: "/x", altText: "ELE GEÇİRİLDİ" });
  assert.equal((await repo.listMediaAssets()).find((m) => m.id === "med_iso_test")!.altText, "A'nın görseli");
  assert.equal((await other.listMediaAssets()).length, 0);

  const content = (await repo.listContents({ locale: "tr", status: "published" }))[0]!;
  const review = await repo.saveCommentReview({ contentId: content.contentId, authorName: "Ali", entryType: "review", rating: 5, body: "A'nın yorumu", status: "approved" });
  await other.saveCommentReview({ id: review.id, contentId: content.contentId, authorName: "Hırsız", entryType: "review", rating: 1, body: "ELE GEÇİRİLDİ", status: "approved" });
  assert.equal((await repo.listCommentsReviews(content.contentId)).find((r) => r.id === review.id)!.body, "A'nın yorumu");
  assert.equal((await other.listCommentsReviews(content.contentId)).length, 0);

  const original = await repo.getContentById(content.contentId, "tr");
  await other.saveContent({ contentId: content.contentId, type: "page", locale: "tr", slug: "hijack", title: "ELE GEÇİRİLDİ", blocks: [] }).catch(() => undefined);
  const after = (await repo.getContentById(content.contentId, "tr"))!;
  assert.equal(after.title, original!.title, "içerik başlığı değişmez");
  assert.equal(after.slug, original!.slug);
  assert.equal((await other.listContents({ locale: "tr" })).length, 0, "başka kiracıda içerik oluşmaz");
});

test("revizyon geçmişi: her değişiklik görüntü saklar, aynısını tekrar saklamaz, geri yüklenebilir, kiracıya kapalıdır", async () => {
  const actor = { id: "u1", email: "Yazar@Example.com" };
  const first = await repo.saveContent(baseInput({ slug: "revizyon-testi", title: "Revizyon 1", status: "draft", actor }));
  const id = first.contentId;
  await repo.saveContent(baseInput({ contentId: id, slug: "revizyon-testi", title: "Revizyon 1", status: "draft", actor }));
  assert.equal((await repo.listRevisions(id, "tr")).length, 1, "içerik değişmediyse yeni revizyon yok");

  await repo.saveContent(baseInput({ contentId: id, slug: "revizyon-testi", title: "Revizyon 2", status: "published", blocks: [para("p1", "Birinci"), para("p2", "İkinci paragraf")], actor }));
  await repo.saveContent(baseInput({ contentId: id, slug: "revizyon-testi-yeni", title: "Revizyon 3", status: "published", blocks: [para("p1", "Üçüncü")], actor: undefined }));

  const list = await repo.listRevisions(id, "tr");
  assert.deepEqual(list.map((r) => r.title), ["Revizyon 3", "Revizyon 2", "Revizyon 1"], "yeniden eskiye");
  assert.equal(list[0]!.authorEmail, "", "aktörsüz kayıt anonim");
  assert.equal(list[1]!.authorEmail, "yazar@example.com", "e-posta küçük harfe iner");
  assert.deepEqual(list.map((r) => r.blockCount), [1, 2, 1]);
  assert.ok(list[1]!.wordCount >= 3);
  assert.deepEqual(list.map((r) => r.status), ["published", "published", "draft"]);

  const rev = (await repo.getRevision(list[1]!.id))!;
  assert.equal(rev.contentId, id);
  assert.equal(rev.snapshot.title, "Revizyon 2");
  assert.equal(rev.snapshot.blocks.length, 2);
  assert.equal(rev.snapshot.status, "published");

  // kiracı yalıtımı
  assert.equal(await other.getRevision(list[1]!.id), null);
  assert.equal((await other.listRevisions(id, "tr")).length, 0);

  // silinince revizyonlar da gider
  await repo.deleteContents([id]);
  assert.equal((await repo.listRevisions(id, "tr")).length, 0);
});

test("revizyon geçmişi en çok 50 kayıt tutar", async () => {
  const { contentId } = await repo.saveContent(baseInput({ slug: "budama-testi", title: "Budama 0", status: "draft" }));
  for (let i = 1; i <= 54; i++) {
    await repo.saveContent(baseInput({ contentId, slug: "budama-testi", title: `Budama ${i}`, status: "draft" }));
  }
  const list = await repo.listRevisions(contentId, "tr", 100);
  assert.equal(list.length, 50);
  assert.equal(list[0]!.title, "Budama 54", "en yeni korunur");
  assert.equal(list.at(-1)!.title, "Budama 5", "en eskiler budanır");
  await repo.deleteContents([contentId]);
});

test("eklenti durumu: kayıt yoksa boş, kısmi güncelleme birleşir, kiracıya kapalıdır", async () => {
  const id = "@x/demo";
  assert.equal(await repo.getSitePlugin(id), null);
  const a = await repo.saveSitePlugin(id, { modules: { discovery: false } });
  assert.equal(a.enabled, true);
  assert.deepEqual(a.modules, { discovery: false });
  const b = await repo.saveSitePlugin(id, { enabled: false, modules: { mcp: true }, settings: { k: 1 } });
  assert.equal(b.enabled, false);
  assert.deepEqual(b.modules, { discovery: false, mcp: true });
  assert.deepEqual(b.settings, { k: 1 });
  assert.equal((await repo.listSitePlugins()).length >= 1, true);
  assert.equal(await other.getSitePlugin(id), null, "başka kiracı görmez");
  await other.saveSitePlugin(id, { enabled: true });
  assert.equal((await repo.getSitePlugin(id))!.enabled, false, "başka kiracı yazması etkilemez");
});

test("site DNA: yazılır, okunur, boşla temizlenir, başka kiracıya dokunmaz", async () => {
  const before = (await other.getSite())?.siteDna ?? null;
  await repo.saveSiteDna("  Kurumsal kimlik özeti.  ");
  assert.equal((await repo.getSite())!.siteDna, "Kurumsal kimlik özeti.");
  assert.equal((await other.getSite())?.siteDna ?? null, before);
  await repo.saveSiteDna("   ");
  assert.equal((await repo.getSite())!.siteDna, null);
});

test("ajan talepleri: oluşturma, listeleme, durum; başka kiracı göremez ve değiştiremez", async () => {
  const { getAgentRequestRepository } = await import("../src/agent-requests-repository");
  const a = getAgentRequestRepository("default");
  const b = getAgentRequestRepository("baska-site");
  const id = await a.create({ kind: "lead", name: "Ayşe", email: "a@x.test", company: "ACME", message: "Teklif", agent: "ChatGPT-User" });
  assert.equal((await a.list()).find((r) => r.id === id)!.status, "new");
  assert.ok((await a.countNew()) >= 1);
  assert.equal((await b.list()).some((r) => r.id === id), false);
  assert.equal(await b.setStatus(id, "handled"), false, "başka kiracı değiştiremez");
  assert.equal(await a.setStatus(id, "handled"), true);
  assert.equal((await a.list({ status: "new" })).some((r) => r.id === id), false);
});

test("AI yönlendirme sayacı: aynı gün/kaynak/yol artar, özet kaynak ve yola göre toplar, kiracıya kapalı", async () => {
  const { getAiReferralRepository } = await import("../src/ai-referral-repository");
  const a = getAiReferralRepository("default");
  await a.recordHit({ source: "chatgpt", path: "/tr/x" });
  await a.recordHit({ source: "chatgpt", path: "/tr/x" });
  await a.recordHit({ source: "perplexity", path: "/tr/y" });
  const s = await a.summary(7);
  assert.equal(s.total, 3);
  assert.deepEqual(s.bySource, [{ source: "chatgpt", hits: 2 }, { source: "perplexity", hits: 1 }]);
  assert.deepEqual(s.topPaths[0], { path: "/tr/x", hits: 2 });
  assert.equal((await getAiReferralRepository("baska-site").summary(7)).total, 0);
});

test("çok dillilik: dil listesi doğrulanır; çeviri taslak oluşur, ziyaretçiden gizlidir, yayınlanınca görünür, kaynak değişince stale olur, kaynak durumu çeviriden etkilenmez", async () => {
  const { translationSourceHash } = await import("@nexpress/core");
  assert.deepEqual(await repo.saveSupportedLocales(["en"]), { ok: false, error: "Varsayılan dil listede kalmalı." });
  assert.equal((await repo.saveSupportedLocales(["tr", "../x"])).ok, false);
  assert.deepEqual(await repo.saveSupportedLocales(["tr", "EN"]), { ok: true, locales: ["tr", "en"] });

  const { contentId } = await repo.saveContent(baseInput({ slug: "dil-testi", title: "Dil Testi", status: "published" }));
  assert.deepEqual((await repo.translationOverview(contentId)).map((r) => [r.locale, r.state]), [["tr", "published"], ["en", "none"]]);

  assert.equal((await repo.createTranslation(contentId, "tr", "tr")).ok, false);
  assert.equal((await repo.createTranslation(contentId, "tr", "de")).ok, false, "etkin olmayan dil");
  assert.deepEqual(await repo.createTranslation(contentId, "tr", "en"), { ok: true });
  assert.equal((await repo.createTranslation(contentId, "tr", "en")).ok, false, "tekrar oluşturulamaz");

  // Taslak çeviri: yönetici listesinde draft, ziyaretçi listesinde yok; kaynak (tr) yayında kalır
  assert.equal((await repo.listContents({ locale: "en" })).find((c) => c.contentId === contentId)!.status, "draft");
  assert.equal((await repo.listContents({ locale: "en", status: "published" })).some((c) => c.contentId === contentId), false);
  assert.equal((await repo.listContents({ locale: "tr", status: "published" })).some((c) => c.contentId === contentId), true);
  assert.equal((await repo.translationOverview(contentId))[1]!.state, "draft");

  // Çeviriyi düzenleyip yayınla: içerik satırının durumu değişmez, yalnızca çeviri yayına girer
  const en = (await repo.getContentById(contentId, "en"))!;
  await repo.saveContent({ ...baseInput({ slug: "language-test", title: "Language Test", status: "published" }), contentId, locale: "en", blocks: en.blocks });
  assert.equal((await repo.listContents({ locale: "en", status: "published" })).some((c) => c.slug === "language-test"), true);
  assert.equal((await repo.translationOverview(contentId))[1]!.state, "published");

  // Kaynak değişince çeviri stale
  await repo.saveContent(baseInput({ slug: "dil-testi", title: "Dil Testi (güncel)", status: "published", contentId, blocks: [para("p1", "Tamamen yeni metin.")] }));
  assert.equal((await repo.translationOverview(contentId))[1]!.state, "stale");
  assert.notEqual(translationSourceHash({ title: "a", blocks: [] }), translationSourceHash({ title: "b", blocks: [] }));

  // Kiracıya kapalı; varsayılan dil çevirisi silinemez; çeviri silinir
  assert.equal((await other.createTranslation(contentId, "tr", "en")).ok, false);
  assert.equal((await repo.deleteTranslation(contentId, "tr")).ok, false);
  assert.deepEqual(await repo.deleteTranslation(contentId, "en"), { ok: true });
  assert.equal((await repo.translationOverview(contentId))[1]!.state, "none");
  await repo.saveSupportedLocales(["tr"]);
});

test("ziyaretçi çözümlemesi: taslak, zamanlanmış, arşiv ve private içerik hiçbir koşulda verilmez; yayında ve kısıtlı verilir", async () => {
  const mk = async (slug: string, status: string, extra: Record<string, unknown> = {}) =>
    (await repo.saveContent(baseInput({ slug, title: slug, status, ...extra }))).contentId;
  await mk("gz-yayinda", "published");
  await mk("gz-taslak", "draft");
  await mk("gz-zamanli", "scheduled");
  await mk("gz-arsiv", "archived");
  await mk("gz-kisitli", "restricted");
  await mk("gz-ozel", "published", { schemaAttributes: { _publishing: { visibility: "private" } } });
  const pub = async (slug: string) => (await repo.resolveContentBySlug(slug, "tr", { publicOnly: true }))?.content.slug ?? null;
  assert.equal(await pub("gz-yayinda"), "gz-yayinda");
  assert.equal(await pub("gz-kisitli"), "gz-kisitli");
  for (const s of ["gz-taslak", "gz-zamanli", "gz-arsiv", "gz-ozel"]) assert.equal(await pub(s), null, s);
  assert.equal((await repo.resolveContentBySlug("gz-taslak", "tr"))?.content.slug, "gz-taslak", "yönetici çözümlemesi etkilenmez");
  assert.equal(await repo.getContentBySlug("gz-taslak", "tr", { publicOnly: true }), null);
});

test("çeviri matrisi: her içerik × dil durumu ve dil başına toplamlar", async () => {
  await repo.saveSupportedLocales(["tr", "en"]);
  const { contentId } = await repo.saveContent(baseInput({ slug: "matris-testi", title: "Matris", status: "published" }));
  let m = await repo.translationMatrix();
  assert.deepEqual(m.locales, ["tr", "en"]);
  const before = m.totals.en!;
  assert.equal(m.rows.find((r) => r.contentId === contentId)!.cells.en!.state, "none");
  await repo.createTranslation(contentId, "tr", "en");
  m = await repo.translationMatrix();
  assert.equal(m.rows.find((r) => r.contentId === contentId)!.cells.en!.state, "draft");
  assert.equal(m.totals.en!.none, before.none - 1);
  assert.equal(m.totals.en!.draft, before.draft + 1);
  assert.equal(m.rows.find((r) => r.contentId === contentId)!.cells.tr!.state, "published");
  await repo.saveSupportedLocales(["tr"]);
});

test("çeviriye özgü öznitelikler: alt metin, odak anahtar kelime ve slug geçmişi dile göre ayrı kalır", async () => {
  const { resolvePublishing } = await import("@nexpress/core");
  await repo.saveSupportedLocales(["tr", "en"]);
  const tr = await repo.saveContent(
    baseInput({ slug: "oznitelik-tr", title: "Öznitelik", status: "published", featuredImage: "/m/a.png", schemaAttributes: { _publishing: { featuredImageAlt: "Türkçe alt", focusKeyword: "anahtar" } } })
  );
  const id = tr.contentId;
  assert.deepEqual(await repo.createTranslation(id, "tr", "en"), { ok: true });
  // Başlangıçta kaynak değerler kopyalanır (çevirmen görsün diye), slug geçmişi devralınmaz
  let en = (await repo.getContentById(id, "en"))!;
  assert.equal(resolvePublishing(en.schemaAttributes).featuredImageAlt, "Türkçe alt");
  assert.deepEqual(resolvePublishing(en.schemaAttributes).slugHistory, []);

  await repo.saveContent({ ...baseInput({ slug: "attr-en", title: "Attr", status: "published" }), contentId: id, locale: "en", blocks: en.blocks, schemaAttributes: { _publishing: { featuredImageAlt: "English alt", focusKeyword: "keyword" } } });
  await repo.saveContent({ ...baseInput({ slug: "attr-en-2", title: "Attr", status: "published" }), contentId: id, locale: "en", blocks: en.blocks, schemaAttributes: { ...en.schemaAttributes, _publishing: { featuredImageAlt: "English alt", focusKeyword: "keyword" } } });
  en = (await repo.getContentById(id, "en"))!;
  const pubEn = resolvePublishing(en.schemaAttributes);
  assert.equal(pubEn.featuredImageAlt, "English alt");
  assert.equal(pubEn.focusKeyword, "keyword");
  assert.equal(en.featuredImage, "/m/a.png", "görsel adresi paylaşılır");
  assert.deepEqual(pubEn.slugHistory, ["oznitelik-tr", "attr-en"], "yalnızca İngilizce satırın eski slug'ları");
  // Türkçe satır etkilenmez
  const pubTr = resolvePublishing((await repo.getContentById(id, "tr"))!.schemaAttributes);
  assert.equal(pubTr.featuredImageAlt, "Türkçe alt");
  assert.equal(pubTr.focusKeyword, "anahtar");
  assert.deepEqual(pubTr.slugHistory, []);
  // İngilizce eski slug İngilizce'de 301 çözer, Türkçe'de çözmez
  assert.equal((await repo.resolveContentBySlug("attr-en", "en"))?.isRedirect, true);
  assert.equal(await repo.resolveContentBySlug("attr-en", "tr"), null);
  await repo.saveSupportedLocales(["tr"]);
});

test("yüklenen temalar: kurulum, sürüm güncelleme, resmi kimlik çakışması, etkin tema silinemez, kiracıya kapalı", async () => {
  const site = (await repo.getSite())!;
  const tokens = site.designTokens;
  const input = (over: Record<string, unknown> = {}) => ({
    themeId: "demo-tema", name: "Demo", version: "1.0.0", author: "T", tagline: "", description: "d", recommendedProfile: "corporate",
    tokens, css: '[data-nx-skin="demo-tema"] .a{color:red}', rawCss: '.a{color:red}', header: null, footer: null, pages: [{ slug: "s", title: "S" }], screenshot: null, checksum: "abc", ...over,
  });
  assert.deepEqual(await repo.installUploadedTheme(input()), { ok: true, replaced: false });
  assert.deepEqual(await repo.installUploadedTheme(input({ version: "1.1.0", checksum: "def" })), { ok: true, replaced: true });
  const list = await repo.listUploadedThemes();
  assert.equal(list.length, 1);
  assert.equal(list[0]!.version, "1.1.0");
  assert.equal(list[0]!.css.includes("demo-tema"), true);
  assert.equal((await repo.installUploadedTheme(input({ themeId: "corporate-aurora" }))).ok, false, "resmi kimlik reddedilir");
  assert.equal((await other.listUploadedThemes()).length, 0, "başka kiracı görmez");

  assert.equal(await repo.activeSkin(), null, "etkin tema resmi: skin yok");
  await repo.activateTheme("demo-tema", tokens);
  assert.equal((await repo.activeSkin())?.themeId, "demo-tema");
  assert.equal((await repo.deleteUploadedTheme("demo-tema")).ok, false, "etkin tema silinemez");
  await repo.activateTheme("corporate-aurora", tokens);
  assert.deepEqual(await repo.deleteUploadedTheme("demo-tema"), { ok: true });
  assert.equal((await repo.listUploadedThemes()).length, 0);
  assert.equal((await repo.deleteUploadedTheme("demo-tema")).ok, false);
});
