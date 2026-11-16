import "server-only";
import type { BlockNode } from "@nexpress/core";
import { getFormDefinitionRepository, getFormSubmissionRepository, getScopedRepository } from "@nexpress/database";
import { looksLikeBotEntry, parseEntryIds, parseEntryPage, parseKadenceForm } from "@nexpress/wp-importer";
import { wpAll, type WpSession } from "./session";

interface KadenceFormPost {
  id: number;
  status: string;
  title?: { raw?: string };
  content?: { raw?: string };
  meta?: Record<string, unknown>;
}

/** `scheduler.ts` ile aynı saklama süresi. */
const RETENTION_DAYS = 365;

export const formIdFor = (wpId: number | string) => `frm_wp_${wpId}`;

/** Kadence form yazıları → NexPress form tanımı. Alan, bildirim alıcısı ve başarı iletisi taşınır. */
export async function importForms(session: WpSession, siteId: string): Promise<{ forms: number; ids: Map<string, string> }> {
  const rows = await wpAll<KadenceFormPost>(session, "kadence_form?status=publish,draft&context=edit&_fields=id,status,title,content,meta", 20);
  const repo = getFormDefinitionRepository(siteId);
  const ids = new Map<string, string>();
  let count = 0;
  for (const row of rows) {
    const parsed = parseKadenceForm(row.content?.raw ?? "");
    if (parsed.fields.length === 0) continue;
    const meta = row.meta ?? {};
    const email = (meta._kad_form_email ?? {}) as { emailTo?: string; subject?: string };
    const messages = (meta._kad_form_messages ?? {}) as { success?: string };
    const redirect = typeof meta._kad_form_redirect === "string" && meta._kad_form_redirect.startsWith("/") ? meta._kad_form_redirect : "";
    const to = String(email.emailTo ?? "").split(/[,;\s]+/).filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value));
    const name = (row.title?.raw ?? "").trim() || `Form ${row.id}`;
    const spec = {
      // WordPress formu iki sütunludur: kısa alanlar yan yana, uzun metin ve onay satırı tam genişlik
      fields: parsed.fields.map((field) => ({ ...field, width: field.type === "textarea" || field.type === "checkbox" || field.type === "checkboxes" || field.options.length > 4 ? ("full" as const) : ("half" as const) })),
      appearance: { columns: 2 as const, labels: "top" as const, density: "compact" as const, buttonAlign: "left" as const, surface: "inline" as const, triggerLabel: "", stepped: false },
      submitLabel: parsed.submitLabel,
      successMessage: (messages.success ?? "").trim() || "Talebiniz alındı. En kısa sürede dönüş yapacağız.",
      redirectUrl: redirect,
    };
    const notify = { enabled: to.length > 0, to, subject: String(email.subject ?? "").slice(0, 150) };
    const id = formIdFor(row.id);
    const status = /subscribe|fig|demo \(copy\)|\(copy\)/i.test(name) ? "paused" : "active";
    const existing = await repo.get(id);
    if (existing) await repo.update(id, { name, status, spec, notify });
    else await repo.create({ id, name, status, spec, notify });
    ids.set(String(row.id), id);
    count += 1;
  }
  return { forms: count, ids };
}

/** Sayfa gövdesindeki `form_block` kimliklerini, kaynak sayfanın sırasıyla gerçek forma bağlar. */
export function rebindFormBlocks(blocks: BlockNode[], order: string[], known: Map<string, string>): { blocks: BlockNode[]; changed: number } {
  let cursor = 0;
  let changed = 0;
  const walk = (nodes: BlockNode[]): BlockNode[] =>
    nodes.map((node) => {
      let next = node;
      if (node.type === "form_block") {
        const target = known.get(order[cursor] ?? "");
        cursor += 1;
        if (target && node.props?.formId !== target) {
          next = { ...node, props: { ...node.props, formId: target } };
          changed += 1;
        }
      }
      return node.children ? { ...next, children: walk(node.children) } : next;
    });
  return { blocks: walk(blocks), changed };
}

/** Sayfa ham metninden Kadence form kimliklerini sırayla okur. */
export function formRefsOf(raw: string): string[] {
  return [...raw.matchAll(/<!--\s*wp:kadence\/advanced-form\s*\{[^}]*?"id":(\d+)/g)].map((match) => match[1] ?? "").filter(Boolean);
}

/**
 * Form girdileri (kişisel veri). Yalnızca panel gelen kutusuna yazılır; ziyaretçi yüzeyine çıkmaz.
 * Bot girdileri `spam` olarak işaretlenir, silinmez. İkinci çalıştırmada aynı girdi tekrar yazılmaz.
 */
export async function importEntries(session: WpSession, siteId: string, known: Map<string, string>): Promise<{ entries: number; spam: number; skipped: number; skippedOld: number }> {
  const ids = new Set<string>();
  for (let page = 1; page <= 30; page += 1) {
    const html = await session.text(`/wp-admin/admin.php?page=kadence-blocks-entries&paged=${page}`);
    const found = parseEntryIds(html);
    const fresh = found.filter((id) => !ids.has(id));
    if (fresh.length === 0) break;
    fresh.forEach((id) => ids.add(id));
  }
  const repo = getFormSubmissionRepository(siteId);
  const site = await getScopedRepository(siteId).getSite();
  const locale = site?.defaultLocale || "tr";
  const have = new Set((await repo.list({ limit: 1000 })).map((row) => `${row.formId}|${row.createdAt.toISOString()}|${row.fields[0]?.value ?? ""}`));
  let entries = 0;
  let spam = 0;
  let skipped = 0;
  let skippedOld = 0;
  for (const id of [...ids].sort((a, b) => Number(a) - Number(b))) {
    const entry = parseEntryPage(await session.text(`/wp-admin/admin.php?page=kadence-blocks-entries&view-entry=${id}`), id);
    if (!entry) {
      skipped += 1;
      continue;
    }
    const formId = known.get(entry.formId) ?? formIdFor(entry.formId);
    const at = entry.createdAt ?? new Date();
    // Gelen kutusu 365 günden eskiyi zamanlayıcıyla siler (KVKK saklama süresi); eski girdiyi yazmak boşa gider.
    if (Date.now() - at.getTime() > RETENTION_DAYS * 86_400_000) {
      skippedOld += 1;
      continue;
    }
    if (have.has(`${formId}|${at.toISOString()}|${entry.fields[0]?.value ?? ""}`)) {
      skipped += 1;
      continue;
    }
    const bot = looksLikeBotEntry(entry.fields);
    if (bot) spam += 1;
    let path = "/";
    try {
      path = new URL(entry.pageUrl).pathname.replace(/\/$/, "") || "/";
    } catch {
      path = "/";
    }
    await repo.create({
      pagePath: path,
      locale,
      formId,
      formTitle: entry.formName,
      fields: entry.fields.map((field, index) => ({ name: `alan_${index + 1}`, label: field.label, value: field.value })),
      status: bot ? "spam" : "read",
      notifyStatus: "skipped",
      createdAt: at,
    });
    entries += 1;
  }
  return { entries, spam, skipped, skippedOld };
}
