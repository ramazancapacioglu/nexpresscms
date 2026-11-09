import fs from "node:fs";
import path from "node:path";
import type { BlockNode, NavigationMenuItem, SiteMenuRecord } from "@nexpress/core";
import { getFormDefinitionRepository, getScopedRepository } from "@nexpress/database";
import { compileRichWpHtml, convertWpHtml, hasRichBlockMarkup, rewriteBlockLinks } from "@nexpress/wp-importer";
import { revalidatePath } from "@/lib/cache";
import { addBridgeReport } from "./store";

interface DatasetPage {
  id: number;
  slug: string;
  path: string;
  title: string;
  excerpt: string;
  image: string | null;
  content: string;
}

interface DatasetPost extends DatasetPage {
  date?: string;
  categories?: number[];
}

interface DatasetCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
}

interface WpDataset {
  pages: DatasetPage[];
  posts: DatasetPost[];
  prompts: DatasetPost[];
  categories: DatasetCategory[];
}

const DEFAULT_ORIGIN = "https://akinsoftizmir.com.tr";

function findRepoRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), "../.."),
    path.resolve(process.cwd(), ".."),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "docs", "akinsoftizmir-com-tr-aktarim", "public", "data", "wp-content.json"))) {
      return dir;
    }
  }
  return process.cwd();
}

function copyDatasetImages(repoRoot: string): Set<string> {
  const localNames = new Set<string>();
  const srcDir = path.join(repoRoot, "docs", "akinsoftizmir-com-tr-aktarim", "public", "images");
  const destDirs = [
    path.join(repoRoot, "apps", "cms", "public", "images"),
    path.join(process.cwd(), "public", "images"),
  ];
  if (!fs.existsSync(srcDir)) return localNames;
  for (const file of fs.readdirSync(srcDir)) {
    if (!/\.(?:webp|png|jpe?g|svg|avif)$/i.test(file)) continue;
    localNames.add(file);
    for (const destDir of destDirs) {
      try {
        fs.mkdirSync(destDir, { recursive: true });
        const destFile = path.join(destDir, file);
        if (!fs.existsSync(destFile)) {
          fs.copyFileSync(path.join(srcDir, file), destFile);
        }
      } catch {
        // Salt okunur dizinlerde atla
      }
    }
  }
  return localNames;
}

function remapLocalImageUrls(blocks: BlockNode[], localFiles: Set<string>): BlockNode[] {
  const mapUrl = (url: unknown): unknown => {
    if (typeof url !== "string" || !url) return url;
    const clean = url.split("?")[0] ?? url;
    const base = clean.split("/").pop() ?? "";
    if (base && localFiles.has(base)) return `/images/${base}`;
    return url;
  };
  return blocks.map((node) => {
    const props = { ...(node.props ?? {}) };
    if ("src" in props) props.src = mapUrl(props.src);
    if ("image" in props) props.image = mapUrl(props.image);
    if ("backgroundImage" in props) props.backgroundImage = mapUrl(props.backgroundImage);
    if (Array.isArray(props.items)) {
      props.items = props.items.map((item) =>
        item && typeof item === "object"
          ? {
              ...(item as Record<string, unknown>),
              ...("image" in (item as Record<string, unknown>) ? { image: mapUrl((item as Record<string, unknown>).image) } : {}),
              ...("src" in (item as Record<string, unknown>) ? { src: mapUrl((item as Record<string, unknown>).src) } : {}),
            }
          : item
      );
    }
    return {
      ...node,
      props,
      children: node.children ? remapLocalImageUrls(node.children, localFiles) : undefined,
    };
  });
}

function buildHeaderMenu(): NavigationMenuItem[] {
  const nav = [
    {
      id: "m_erp",
      label: "ERP Çözümleri",
      href: "/kurumsal-kaynak-planlama",
      children: [
        { id: "m_erp_1", label: "Wolvox ERP", href: "/wolvox-erp" },
        { id: "m_erp_2", label: "Wolvox İK", href: "/insan-kaynaklari-yonetimi" },
        { id: "m_erp_3", label: "Wolvox CRM", href: "/wolvox-crm-yonetimi" },
        { id: "m_erp_4", label: "Wolvox Webconnect", href: "/wolvox-webconnect" },
        { id: "m_erp_5", label: "Wolvox MRP Üretim Yöntemi", href: "/wolvox-uretim-yontemi" },
      ],
    },
    {
      id: "m_muh",
      label: "Muhasebe Programları",
      href: "/muhasebe-programlari",
      children: [
        { id: "m_muh_1", label: "Ön Muhasebe Yazılımı", href: "/on-muhasebe-programi" },
        { id: "m_muh_2", label: "Genel Muhasebe Yazılımı", href: "/genel-muhasebe-programi" },
        { id: "m_muh_3", label: "OctoCloud Bulut Muhasebe", href: "/octocloud" },
        { id: "m_muh_4", label: "Octo Plus Kolay Muhasebe", href: "/octoplus" },
      ],
    },
    {
      id: "m_sek",
      label: "Sektörel Programlar",
      href: "/sektorel-cozumler",
      children: [
        { id: "m_sek_1", label: "Wolvox Restoran", href: "/akinsoft-wolvox-restoran-yonetimi" },
        { id: "m_sek_2", label: "Mobil Satış", href: "/mobil-satis" },
        { id: "m_sek_3", label: "Süper Market Yazılımı", href: "/super-market-yonetimi" },
        { id: "m_sek_4", label: "Wolvox Hızlı Satış Programı", href: "/wolvox-hizli-satis" },
        { id: "m_sek_5", label: "Otel Yönetimi Programı", href: "/otel-yonetimi-programi" },
        { id: "m_sek_6", label: "Sürücü Kursu Otomasyonu", href: "/surucu-kursu-otomasyonu" },
        { id: "m_sek_7", label: "Servis Yönetimi", href: "/servis-yonetimi" },
        { id: "m_sek_8", label: "Wolvox Fiyatmatik", href: "/fiyatmatik" },
      ],
    },
    {
      id: "m_edon",
      label: "E-Dönüşüm",
      href: "/akinsoft-e-donusum",
      children: [
        { id: "m_edon_1", label: "E-Arşiv Fatura", href: "/e-arsiv-fatura" },
        { id: "m_edon_2", label: "e-Defter", href: "/e-defter" },
        { id: "m_edon_3", label: "e-Fatura", href: "/e-fatura" },
        { id: "m_edon_4", label: "e-İrsaliye", href: "/e-irsaliye" },
        { id: "m_edon_5", label: "e-Müstahsil Makbuzu", href: "/e-mustahsil-makbuzu" },
        { id: "m_edon_6", label: "E-Adisyon", href: "/e-adisyon" },
        { id: "m_edon_7", label: "e-Mutabakat", href: "/e-mutabakat" },
      ],
    },
    {
      id: "m_bulut",
      label: "Bulut Yazılımlar",
      href: "/bulut-yazilim-cozumleri",
      children: [
        { id: "m_bulut_1", label: "E-Ticaret", href: "/e-ticaret" },
        { id: "m_bulut_2", label: "Yedekleme Programı", href: "/bulut-yedekleme-programi" },
        { id: "m_bulut_3", label: "Akınsoft MyFranchise", href: "/akinsoft-myfranchise" },
        { id: "m_bulut_4", label: "E-Ofis Yazılımı", href: "/e-ofis" },
        { id: "m_bulut_5", label: "Hotel Smart", href: "/hotel-smart" },
        { id: "m_bulut_6", label: "Pro Kuaför", href: "/prokuafor" },
        { id: "m_bulut_7", label: "QR Menü", href: "/qr-menu" },
      ],
    },
    {
      id: "m_kur",
      label: "Kurumsal",
      href: "/hakkimizda",
      children: [
        { id: "m_kur_1", label: "Kampanyalar", href: "/akinsoft-kampanyalar" },
        { id: "m_kur_2", label: "Hakkımızda", href: "/hakkimizda" },
        { id: "m_kur_3", label: "Akınsoft SSS", href: "/akinsoft-sikca-sorulan-sorular" },
        { id: "m_kur_4", label: "Demo Talebi", href: "/akinsoft-demo-talebi" },
        { id: "m_kur_5", label: "Destek Talebi", href: "/akinsoft-destek" },
      ],
    },
    { id: "m_iletisim", label: "İletişim", href: "/iletisim", children: [] },
  ];
  return nav.map((item) => ({
    ...item,
    source: { kind: "custom" as const },
    children: item.children.map((child) => ({ ...child, source: { kind: "custom" as const }, children: [] })),
  }));
}

async function ensureDefaultLeadForm(siteId: string): Promise<void> {
  const forms = getFormDefinitionRepository(siteId);
  const existing = await forms.get("frm_wp_1");
  const spec = {
    fields: [
      { id: "f_name", name: "ad_soyad", label: "Ad Soyad", type: "text" as const, required: true, placeholder: "Adınız ve soyadınız", help: "", width: "half" as const, options: [] },
      { id: "f_company", name: "firma_adi", label: "Firma Adı", type: "text" as const, required: false, placeholder: "Firma unvanı", help: "", width: "half" as const, options: [] },
      { id: "f_phone", name: "telefon", label: "Telefon", type: "tel" as const, required: true, placeholder: "0 (5XX) XXX XX XX", help: "", width: "half" as const, options: [] },
      { id: "f_email", name: "eposta", label: "E-Posta", type: "email" as const, required: false, placeholder: "ornek@firma.com", help: "", width: "half" as const, options: [] },
      { id: "f_message", name: "mesaj", label: "Mesajınız / Talebiniz", type: "textarea" as const, required: false, placeholder: "İlgilendiğiniz yazılım veya talebiniz", help: "", width: "full" as const, options: [] },
    ],
    submitLabel: "Gönder",
    successMessage: "Talebiniz alındı. Uzman ekibimiz en kısa sürede sizinle iletişime geçecektir.",
    redirectUrl: "",
  };
  if (existing) await forms.update("frm_wp_1", { name: "İletişim & Demo Talep Formu", spec });
  else await forms.create({ id: "frm_wp_1", name: "İletişim & Demo Talep Formu", spec });
}

/**
 * Kaynak WordPress veri kümesinden (veya mevcut sayfalardan) tüm zengin blok yerleşimlerini,
 * kategorileri, görselleri ve üst/alt menüleri sıfır taşma ve tam RSC uyumuyla yeniden derler.
 */
export async function reconstructRichSiteDataset(siteId: string): Promise<{
  ok: boolean;
  pagesUpdated: number;
  postsUpdated: number;
  categoriesUpdated: number;
  imagesCopied: number;
}> {
  const repoRoot = findRepoRoot();
  const jsonPath = path.join(repoRoot, "docs", "akinsoftizmir-com-tr-aktarim", "public", "data", "wp-content.json");
  if (!fs.existsSync(jsonPath)) {
    return { ok: false, pagesUpdated: 0, postsUpdated: 0, categoriesUpdated: 0, imagesCopied: 0 };
  }

  const localImages = copyDatasetImages(repoRoot);
  const dataset = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as WpDataset;
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale || "tr";

  await ensureDefaultLeadForm(siteId);

  const catIdToSlug = new Map<number, string>();
  let categoriesUpdated = 0;
  const existingTax = await repo.listTaxonomies();
  for (const cat of dataset.categories ?? []) {
    catIdToSlug.set(cat.id, cat.slug);
    const found = existingTax.find((row) => row.taxonomyType === "category" && row.slug === cat.slug);
    await repo.saveTaxonomy({
      id: found?.id,
      taxonomyType: "category",
      slug: cat.slug,
      name: cat.name,
      description: cat.description || undefined,
    });
    categoriesUpdated += 1;
  }

  const existingContents = [
    ...(await repo.listContents({ locale })),
    ...(await repo.listContents({ locale, status: "trashed" })),
  ];
  const templateSlugs = new Set((await repo.listContents({ locale, type: "template" })).map((row) => row.slug));
  const bySlug = new Map(existingContents.map((row) => [row.slug, row]));
  const byId = new Map(existingContents.map((row) => [row.id, row]));

  let pagesUpdated = 0;
  for (const page of dataset.pages ?? []) {
    const rawSlug = page.slug === "home" ? "ana-sayfa" : page.slug;
    const slug = templateSlugs.has(rawSlug) ? `${rawSlug}-sayfa` : rawSlug;
    const existing = byId.get(`cnt_wp_${page.id}`) ?? bySlug.get(slug) ?? bySlug.get(rawSlug) ?? null;
    const finalSlug = existing && !templateSlugs.has(existing.slug) ? existing.slug : slug;
    const contentId = existing?.id ?? `cnt_wp_${page.id}`;
    const compiled = hasRichBlockMarkup(page.content)
      ? compileRichWpHtml(page.content, { baseUrl: DEFAULT_ORIGIN }).blocks
      : convertWpHtml(page.content, { baseUrl: DEFAULT_ORIGIN }).blocks;
    const rewritten = rewriteBlockLinks(compiled, DEFAULT_ORIGIN, "").blocks;
    const blocks = remapLocalImageUrls(rewritten, localImages);
    const featured = page.image ? (page.image.startsWith("http") ? page.image : page.image) : existing?.featuredImage ?? null;

    await repo.saveContent({
      contentId,
      type: "page",
      status: "published",
      importanceScore: slug === "ana-sayfa" ? 10 : 8,
      schemaType: existing?.schemaType ?? "WebPage",
      schemaAttributes: {
        ...(existing?.schemaAttributes ?? {}),
        migratedFrom: "wordpress",
        wpId: String(page.id),
        wpKind: "page",
      },
      featuredImage: featured,
      locale,
      slug: finalSlug,
      title: page.title,
      excerpt: page.excerpt || undefined,
      tldr: (page.excerpt || page.title).slice(0, 260),
      blocks,
      metaTitle: existing?.metaTitle ?? page.title,
      metaDescription: existing?.metaDescription ?? (page.excerpt ? page.excerpt.slice(0, 160) : undefined),
    });
    pagesUpdated += 1;
  }

  let postsUpdated = 0;
  const allPosts = [...(dataset.posts ?? []), ...(dataset.prompts ?? [])];
  for (const post of allPosts) {
    const slug = post.slug;
    const existing = byId.get(`cnt_wp_${post.id}`) ?? bySlug.get(slug) ?? null;
    const contentId = existing?.id ?? `cnt_wp_${post.id}`;
    const compiled = hasRichBlockMarkup(post.content)
      ? compileRichWpHtml(post.content, { baseUrl: DEFAULT_ORIGIN }).blocks
      : convertWpHtml(post.content, { baseUrl: DEFAULT_ORIGIN }).blocks;
    const rewritten = rewriteBlockLinks(compiled, DEFAULT_ORIGIN, "").blocks;
    const blocks = remapLocalImageUrls(rewritten, localImages);
    const catSlugs = (post.categories ?? []).map((id) => catIdToSlug.get(id)).filter((s): s is string => Boolean(s));
    const date = post.date ? new Date(post.date) : null;

    await repo.saveContent({
      contentId,
      type: "post",
      status: "published",
      importanceScore: 7,
      schemaType: existing?.schemaType ?? "Article",
      schemaAttributes: {
        ...(existing?.schemaAttributes ?? {}),
        migratedFrom: "wordpress",
        wpId: String(post.id),
        wpKind: "post",
        _publishing: {
          visibility: "public",
          categories: catSlugs,
          tags: [],
          featuredImageUrl: post.image || undefined,
          allowComments: true,
        },
      },
      featuredImage: post.image ?? existing?.featuredImage ?? null,
      locale,
      slug,
      title: post.title,
      excerpt: post.excerpt || undefined,
      tldr: (post.excerpt || post.title).slice(0, 260),
      blocks,
      metaTitle: existing?.metaTitle ?? post.title,
      metaDescription: existing?.metaDescription ?? (post.excerpt ? post.excerpt.slice(0, 160) : undefined),
      ...(date && !Number.isNaN(date.getTime()) ? { publishedAt: date } : {}),
    });
    postsUpdated += 1;
  }

  const navLayout = await repo.getNavigationLayout(locale);
  if (navLayout) {
    const headerItems = buildHeaderMenu();
    const menus: SiteMenuRecord[] = [
      { id: "menu_wp_header", name: "Ana Menü", header: true, items: headerItems },
    ];
    await repo.saveNavigationLayout({
      locale,
      headerConfig: {
        ...navLayout.headerConfig,
        topBar: {
          ...navLayout.headerConfig.topBar,
          enabled: true,
          announcementText: "Akınsoft İzmir Ana Bayi — Dijital Evre",
          contactPhone: "0 232 332 02 15",
          contactEmail: "akinsoft@dijitalevre.com",
        },
        mainBar: {
          ...navLayout.headerConfig.mainBar,
          ctaLabel: "0 232 332 02 15",
          ctaHref: "tel:+902323320215",
        },
      },
      footerConfig: navLayout.footerConfig,
      menuItems: headerItems,
      menus,
    });
  }

  await repo.saveSiteSettings({
    customizer: {
      header: {
        logoText: "Akınsoft İzmir Ana Bayi",
        logoImage: "/images/akinsoft-izmir-logo-5.webp",
      },
      layout: {
        articleWidth: "1290px",
      },
    },
  });

  await addBridgeReport(siteId, {
    updated: pagesUpdated + postsUpdated,
    images: localImages.size,
    menus: 1,
    forms: 1,
  });

  try {
    await revalidatePath("/");
  } catch {
    // Betik modunda önbellek temizliği atlanır
  }

  return {
    ok: true,
    pagesUpdated,
    postsUpdated,
    categoriesUpdated,
    imagesCopied: localImages.size,
  };
}

