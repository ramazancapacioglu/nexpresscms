import { NextResponse } from "next/server";
import { getBackupRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-api";
import { BACKUP_LIMITS, parseBackup, restoreMedia } from "@/lib/backup";
import { invalidateSite } from "@/lib/cache";

export const runtime = "nodejs";

const REPLACE_PHRASE = "GERI YUKLE";

/**
 * Yedeği doğrular (`dryRun=1`: yalnızca özet) veya içe aktarır. `mode=merge` yalnızca eksikleri ekler;
 * `mode=replace` kiracının yedek tablolarını silip yedekten yazar ve onay metni (`GERI YUKLE`) ister.
 * Veritabanı tek işlemdedir (hata → hiçbir şey değişmez); görseller ancak veritabanı başarılı olunca yazılır.
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, errors: ["Dosya seçilmedi."] }, { status: 400 });
  if (file.size > BACKUP_LIMITS.zipBytes) return NextResponse.json({ ok: false, errors: [`Dosya ${BACKUP_LIMITS.zipBytes / 1024 / 1024} MB sınırını aşıyor.`] }, { status: 413 });
  const parsed = parseBackup(new Uint8Array(await file.arrayBuffer()));
  if (!parsed.ok) return NextResponse.json({ ok: false, errors: parsed.errors }, { status: 422 });

  const siteId = auth.session.siteId;
  const warnings = [...parsed.warnings];
  if (parsed.manifest.siteId !== siteId) warnings.push(`Yedek "${parsed.manifest.siteId}" kiracısından; "${siteId}" kiracısına aktarılıyor. Kimlikler başka kiracıda kullanılıyorsa o satırlar atlanır.`);
  const summary = { createdAt: parsed.manifest.createdAt, sourceSite: parsed.manifest.siteId, tables: parsed.manifest.tables, media: parsed.manifest.media, personal: parsed.manifest.personal, hasSite: parsed.manifest.hasSite };

  const form2 = form!;
  if (form2.get("dryRun") === "1") return NextResponse.json({ ok: true, dryRun: true, summary, warnings });

  const mode = form2.get("mode") === "replace" ? "replace" : "merge";
  if (mode === "replace" && form2.get("confirm") !== REPLACE_PHRASE) return NextResponse.json({ ok: false, errors: [`Değiştirme için onay metnini yazın: ${REPLACE_PHRASE}`] }, { status: 400 });

  let report;
  try {
    report = await getBackupRepository(siteId).importData(parsed.data, mode);
  } catch (error) {
    await recordAudit({ id: auth.session.sub, email: auth.session.email }, "backup.import", { detail: `başarısız (${mode}): ${error instanceof Error ? error.message.slice(0, 120) : "hata"}`, siteId });
    return NextResponse.json({ ok: false, errors: ["İçe aktarma başarısız oldu; hiçbir veri değişmedi."] }, { status: 500 });
  }
  const mediaResult = await restoreMedia(siteId, parsed.media);
  await invalidateSite(siteId);
  await recordAudit({ id: auth.session.sub, email: auth.session.email }, "backup.import", { detail: `${mode}: ${Object.values(report.tables).reduce((n, t) => n + t.inserted, 0)} satır eklendi, ${mediaResult.written} görsel`, siteId });
  return NextResponse.json({ ok: true, report, media: mediaResult, warnings: [...warnings, ...report.warnings], note: "Arama dizinini Ayarlar'dan/SEO sayfasından yeniden oluşturun." });
}
