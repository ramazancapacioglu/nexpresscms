"use server";

import { altTextRequest, createChatClient, createRateLimiter, parseAltText, resolveLocalizedSiteIdentity, type ChatClient } from "@nexpress/core";
import { getScopedRepository, type MediaAssetDto } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "@/lib/cache";
import { renderVariant } from "@/lib/media/process";
import { getOriginal } from "@/lib/media/storage";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Ücretli model çağrısı kötüye kullanılmasın: kullanıcı başına dakikada en çok 20 görsel. */
const limit = createRateLimiter(20, 60_000);
/** Toplu doldurmada tek istekte işlenecek en çok görsel. */
const BULK_MAX = 15;

function client(): ChatClient | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return apiKey ? createChatClient({ apiKey, baseUrl: process.env.OPENAI_BASE_URL, model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_CHAT_MODEL, timeoutMs: 25_000, maxRetries: 1 }) : null;
}

/** Görselin küçük (768 px) JPEG özetini model için `data:` adresine çevirir; özgün dosya sunucuyu terk etmez, yalnızca bu küçük kopya gönderilir. */
async function describe(siteId: string, asset: MediaAssetDto, chat: ChatClient, locale: string, siteName: string): Promise<string | null> {
  if (asset.kind !== "image") return null;
  const original = await getOriginal(siteId, asset.id);
  if (!original) return null;
  const jpeg = await renderVariant(original, 768, "jpg");
  const hints = altTextRequest({ siteName, title: asset.titleText ?? undefined, filename: asset.filename, locale });
  const raw = await chat.completeJsonWithImage({ system: hints.system, user: hints.user, imageDataUrl: `data:image/jpeg;base64,${jpeg.toString("base64")}`, maxTokens: 120 });
  return parseAltText(raw);
}

/** Tek görsel için AI alt metin önerisi. Yalnızca önerir; kaydetmek editörün adımıdır. */
export async function suggestAltTextAction(input: { id: string }): Promise<Result<{ alt: string }>> {
  const me = await requireUser({ audit: "media.altSuggest" });
  if (!limit.take(me.sub)) return { ok: false, error: "Çok sık istek: bir dakika sonra tekrar deneyin." };
  const chat = client();
  if (!chat) return { ok: false, error: "OPENAI_API_KEY tanımlı değil." };
  const repo = getScopedRepository(me.siteId);
  const asset = await repo.findMediaAsset(input.id);
  if (!asset || asset.kind !== "image") return { ok: false, error: "Görsel bulunamadı." };
  const site = await repo.getSite();
  const identity = resolveLocalizedSiteIdentity(site, site?.defaultLocale ?? "tr");
  try {
    const alt = await describe(me.siteId, asset, chat, site?.defaultLocale ?? "tr", identity.name);
    return alt ? { ok: true, alt } : { ok: false, error: "Model kullanılabilir bir alt metin üretemedi." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 160) : "Alt metin üretilemedi." };
  }
}

/**
 * Alt metni boş görselleri (en çok 15) AI ile doldurur ve kaydeder; dolu alt metne, başlığa ve diğer alanlara dokunmaz.
 * Kalan sayı döner: tekrar çalıştırarak devam edilir.
 */
export async function fillMissingAltAction(): Promise<Result<{ filled: number; failed: number; remaining: number }>> {
  const me = await requireUser({ audit: "media.altFill" });
  const chat = client();
  if (!chat) return { ok: false, error: "OPENAI_API_KEY tanımlı değil." };
  const repo = getScopedRepository(me.siteId);
  const missing = (await repo.listMediaAssets()).filter((a) => a.kind === "image" && !a.altText.trim());
  const batch = missing.slice(0, BULK_MAX);
  if (batch.length > 0 && !limit.take(me.sub)) return { ok: false, error: "Çok sık istek: bir dakika sonra tekrar deneyin." };
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const siteName = resolveLocalizedSiteIdentity(site, locale).name;
  let filled = 0;
  let failed = 0;
  for (const asset of batch) {
    try {
      const alt = await describe(me.siteId, asset, chat, locale, siteName);
      if (!alt) {
        failed += 1;
        continue;
      }
      // Yeniden okunan güncel kayıt üzerinden yalnızca altText yazılır (başka bir editör arada değiştirdiyse ezilmez)
      const current = await repo.findMediaAsset(asset.id);
      if (!current || current.altText.trim()) continue;
      await repo.saveMediaAsset({
        id: current.id,
        filename: current.filename,
        url: current.url,
        mimeType: current.mimeType,
        width: current.width,
        height: current.height,
        sizeBytes: current.sizeBytes,
        altText: alt,
        titleText: current.titleText ?? undefined,
        caption: current.caption ?? undefined,
        description: current.description ?? undefined,
        focalPoint: current.focalPoint,
      });
      filled += 1;
    } catch {
      failed += 1;
    }
  }
  await revalidatePath("/admin/media");
  await revalidatePath("/");
  return { ok: true, filled, failed, remaining: Math.max(0, missing.length - filled - failed) };
}
