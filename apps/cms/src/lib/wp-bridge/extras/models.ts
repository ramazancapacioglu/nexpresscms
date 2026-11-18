import "server-only";
import type { BlockNode } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { lastPathSegment } from "@nexpress/core";
import { parseCampaignFields } from "@nexpress/wp-importer";
import { compileBlocks } from "../live-import";
import { wpAll, type WpSession } from "./session";

interface WpPageRaw {
  id: number;
  slug: string;
  content?: { raw?: string; rendered?: string };
}

/**
 * Kampanya özel alanları (`camp_*`): indirim, hediye, ürün adı ve ürün sayfası, başlangıç/bitiş, şartlar.
 * Metinden türetilen değerlerin üzerine yazar (kaynaktaki alan kesindir). Bitiş tarihi geçmiş kampanya yayında kalır ama
 * "süresi doldu" sayılır: ilgili model kartı ve ana sayfa vitrini onu göstermez (WordPress'teki davranış).
 */
export async function importCampaignFields(session: WpSession, siteId: string): Promise<{ updated: number; withProduct: number; expired: number }> {
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  let updated = 0;
  let withProduct = 0;
  let expired = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (const row of await repo.listContents({ locale, type: "campaign" })) {
    const wpId = /^cnt_wp_(\d+)$/.exec(row.id)?.[1];
    if (!wpId) continue;
    let fields: ReturnType<typeof parseCampaignFields>;
    try {
      fields = parseCampaignFields(await session.text(`/wp-admin/post.php?post=${wpId}&action=edit`));
    } catch {
      continue;
    }
    if (Object.keys(fields).length === 0) continue;
    const attrs = (row.schemaAttributes ?? {}) as Record<string, unknown>;
    const previous = (attrs.campaign ?? {}) as Record<string, unknown>;
    const productPath = fields.productUrl ? `/${lastPathSegment(fields.productUrl)}` : undefined;
    const campaign: Record<string, unknown> = {
      ...previous,
      ...(fields.discount ? { discount: fields.discount } : {}),
      ...(fields.gift ? { gift: fields.gift } : {}),
      ...(fields.productName ? { productName: fields.productName } : {}),
      ...(productPath && productPath !== "/" ? { productUrl: productPath } : {}),
      ...(fields.startDate ? { startDate: fields.startDate } : {}),
      ...(fields.endDate ? { endDate: fields.endDate } : {}),
      ...(fields.terms ? { terms: fields.terms } : {}),
    };
    await repo.saveContent({
      contentId: row.id,
      type: row.type,
      status: row.status,
      importanceScore: row.importanceScore,
      schemaType: row.schemaType,
      schemaAttributes: { ...attrs, campaign },
      featuredImage: row.featuredImage,
      locale: row.locale,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? undefined,
      tldr: row.tldr ?? undefined,
      blocks: row.blocks,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      canonicalUrl: row.canonicalUrl ?? undefined,
      noIndex: row.noIndex,
    });
    updated += 1;
    if (campaign.productUrl) withProduct += 1;
    if (typeof campaign.endDate === "string" && campaign.endDate < today) expired += 1;
  }
  return { updated, withProduct, expired };
}

const FORM_ATTR = /wp:kadence\/advanced-form\s*\{[^}]*?"id":(\d+)/;

/** Derlenmiş kaynak bloklarda form henüz bir kimliğe bağlı değildir; ilk form bloğu aranır. */
const hasForm = (node: BlockNode): boolean => node.type === "form_block" || (node.children ?? []).some((child) => hasForm(child));

/**
 * "Form + kampanya kartı" modeli: kaynakta `[akin_kampanyalar urun="…"]` kısa kodu ile bir Kadence formunu yan yana koyan satır,
 * NexPress'te tek bir `contact_campaign` bloğu olur. Yalnızca form bloğunun yerine model yazılır; aynı bantta duran başlık, metin ve
 * özellik kartları korunur. Önceki sürüm formu taşıyan bandın tamamını değiştiriyordu (bant sayfanın gövdesini de taşıyorsa içerik
 * kayboluyordu); bu yüzden model bandı (`wp_model_<id>`) kaynak sayfadan yeniden derlenip içindeki form modelle değiştirilir.
 * Ürün adresi kısa koddaki `urun` değeridir.
 */
export async function placeContactCampaign(session: WpSession, siteId: string): Promise<{ placed: number; pages: string[] }> {
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale || "tr";
  const raws = await wpAll<WpPageRaw>(session, "pages?status=publish&context=edit&_fields=id,slug,content", 50);
  const rows = await repo.listContents({ locale, type: "page" });
  let placed = 0;
  const pages: string[] = [];
  for (const raw of raws) {
    const text = raw.content?.raw ?? "";
    const sc = /\[akin_kampanyalar([^\]]*)\]/.exec(text);
    const urun = /urun="([^"]+)"/.exec(sc?.[1] ?? "")?.[1];
    const wpForm = FORM_ATTR.exec(text)?.[1];
    if (!sc || !urun || !wpForm) continue;
    const row = rows.find((item) => item.id === `cnt_wp_${raw.id}`);
    if (!row) continue;
    const formId = `frm_wp_${wpForm}`;
    const modelId = `wp_model_${raw.id}`;
    const compiled = compileBlocks(raw.content?.rendered ?? "", [], raw.id, session.origin, {}, false).find((node) => hasForm(node));
    if (!compiled) continue;
    const heading = (() => {
      const form = (function find(node: BlockNode): BlockNode | null {
        if (node.type === "form_block") return node;
        for (const child of node.children ?? []) {
          const hit = find(child);
          if (hit) return hit;
        }
        return null;
      })(compiled);
      const title = (form?.props as { title?: string } | undefined)?.title;
      return typeof title === "string" ? title : "";
    })();
    const model: BlockNode = {
      id: modelId,
      type: "contact_campaign",
      props: { formId, productUrl: `/${lastPathSegment(urun)}`, campaignSlug: "", heading: heading || "Detaylı bilgi için Sizi arayalım.", note: "" },
    };
    const swapForm = (node: BlockNode): BlockNode => {
      if (node.type === "form_block") return model;
      return node.children ? { ...node, children: node.children.map(swapForm) } : node;
    };
    // Eski kayıt: bandın tamamı model olmuştu. Yeni kayıt: model, bandın içinde. İkisi de aynı kaynaktan yeniden kurulur.
    const rebuilt = swapForm(compiled);
    const at = row.blocks.findIndex((node) => node.id === modelId);
    if (at < 0) continue;
    const blocks = [...row.blocks.slice(0, at), rebuilt, ...row.blocks.slice(at + 1)];
    if (JSON.stringify(blocks) === JSON.stringify(row.blocks)) continue;
    await repo.saveContent({
      contentId: row.id,
      type: row.type,
      status: row.status,
      importanceScore: row.importanceScore,
      schemaType: row.schemaType,
      schemaAttributes: row.schemaAttributes,
      featuredImage: row.featuredImage,
      locale: row.locale,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? undefined,
      tldr: row.tldr ?? undefined,
      blocks,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      canonicalUrl: row.canonicalUrl ?? undefined,
      noIndex: row.noIndex,
    });
    placed += 1;
    pages.push(row.slug);
  }
  return { placed, pages };
}

/**
 * Her sayfada sabit hızlı iletişim: kaynaktaki sabit öğeler ("Sizi arayalım!" ve WhatsApp düğmesi) ayarlara yazılır.
 * Form, kaynak sitedeki `hizliiletisim` formudur (içe aktarılmış `frm_wp_<id>`); WhatsApp numarası kaynak öğenin bağlantısından okunur.
 */
export async function setupQuickContact(session: WpSession, siteId: string): Promise<{ formId: string; whatsapp: string }> {
  const repo = getScopedRepository(siteId);
  const forms = (await repo.getSite()) ? await (await import("@nexpress/database")).getFormDefinitionRepository(siteId).list() : [];
  const quick = forms.find((form) => /hizli|h[ıi]zl[ıi]/i.test(form.name) && form.status === "active");
  const home = await session.text("/");
  const wa = /api\.whatsapp\.com\/send\/?\?phone=(\d{10,15})/.exec(home)?.[1] ?? "";
  await repo.saveSiteSettings({ general: { ...(quick ? { quickContactFormId: quick.id } : {}), ...(wa ? { whatsappNumber: wa } : {}) } });
  return { formId: quick?.id ?? "", whatsapp: wa ? `${wa.slice(0, 4)}…` : "" };
}
