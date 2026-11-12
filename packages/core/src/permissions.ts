/**
 * Roller ve izinler (saf mantık, uç ortamda da çalışır). Dört rol vardır: Yönetici, Editör, Yazar, Katkıcı.
 * Yönetici ve Editör tam panel kullanır (eski davranış korunur; Editör kullanıcı, ayar ve sistem bölümlerini açamaz).
 * Yazar ve Katkıcı "sınırlı" rollerdir: yalnızca kendi içeriklerini yazar, panelin geri kalanı kapalıdır.
 * Varsayılan ret: bir eylem açıkça bir izne bağlanmadıkça yalnızca `admin` ve `editor` roller geçer.
 */
import { USER_ROLE_IDS, type UserRole } from "./session-token";

export const USER_ROLES = USER_ROLE_IDS;

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Yönetici",
  editor: "Editör",
  author: "Yazar",
  contributor: "Katkıcı",
};

export const ROLE_DESCRIPTION: Record<UserRole, string> = {
  admin: "Her şeye erişir: kullanıcılar, ayarlar, yedek, sistem ve tüm içerik.",
  editor: "Tüm içeriği, medyayı, görünümü, SEO'yu ve ticareti yönetir; kullanıcı, ayar ve sistem bölümlerini açamaz.",
  author: "Kendi içeriğini yazar, yayınlar ve günceller; medya yükler. Başkasının içeriğine ve panelin geri kalanına erişemez.",
  contributor: "Kendi içeriğini taslak olarak yazar; yayınlayamaz, medya yükleyemez. Taslağı bir editör yayınlar.",
};

export const isUserRole = (value: unknown): value is UserRole => typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);

export const CAPABILITIES = [
  "content.create",
  "content.editOwn",
  "content.editAny",
  "content.publish",
  "content.delete",
  "media.upload",
  "media.manage",
  "taxonomy.manage",
  "comments.moderate",
  "seo.manage",
  "appearance.manage",
  "commerce.manage",
  "forms.manage",
  "plugins.manage",
  "users.manage",
  "settings.manage",
  "panel.full",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABEL: Record<Capability, { group: string; label: string }> = {
  "content.create": { group: "İçerik", label: "Yeni içerik oluşturma" },
  "content.editOwn": { group: "İçerik", label: "Kendi içeriğini düzenleme" },
  "content.editAny": { group: "İçerik", label: "Herkesin içeriğini düzenleme" },
  "content.publish": { group: "İçerik", label: "Yayınlama ve zamanlama" },
  "content.delete": { group: "İçerik", label: "Silme / çöpe taşıma" },
  "media.upload": { group: "Medya", label: "Dosya yükleme" },
  "media.manage": { group: "Medya", label: "Medya kitaplığını yönetme" },
  "taxonomy.manage": { group: "Düzen", label: "Kategori ve etiketler" },
  "comments.moderate": { group: "Düzen", label: "Yorum ve inceleme denetimi" },
  "seo.manage": { group: "Site", label: "SEO ve yönlendirmeler" },
  "appearance.manage": { group: "Site", label: "Tema, menü ve stüdyo" },
  "commerce.manage": { group: "Site", label: "Ticaret ve kampanyalar" },
  "forms.manage": { group: "Site", label: "Formlar ve talepler" },
  "plugins.manage": { group: "Site", label: "Eklentiler" },
  "users.manage": { group: "Yönetim", label: "Kullanıcılar ve roller" },
  "settings.manage": { group: "Yönetim", label: "Ayarlar, yedek, sistem, denetim günlüğü" },
  "panel.full": { group: "Yönetim", label: "Tam panel (gösterge paneli ve araçlar)" },
};

const FULL: readonly Capability[] = CAPABILITIES;
const EDITOR: readonly Capability[] = CAPABILITIES.filter((c) => c !== "users.manage" && c !== "settings.manage");

export const ROLE_CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  admin: FULL,
  editor: EDITOR,
  author: ["content.create", "content.editOwn", "content.publish", "media.upload"],
  contributor: ["content.create", "content.editOwn"],
};

export const roleCan = (role: UserRole | undefined | null, capability: Capability): boolean =>
  role !== undefined && role !== null && (ROLE_CAPABILITIES[role] as readonly Capability[] | undefined)?.includes(capability) === true;

/** Tam paneli kullanamayan roller (yalnızca kendi içeriği). */
export const isLimitedRole = (role: UserRole | undefined | null): boolean => !roleCan(role, "panel.full");

/** Sınırlı rollerin açabildiği yönetim yolları (ön ek eşleşmesi). `/admin` kökü "içeriklerim" sayfasına yönlenir. */
export const LIMITED_ADMIN_PATHS: readonly string[] = ["/admin/my-content", "/admin/contents", "/admin/media", "/admin/profile", "/admin/help"];

export function canOpenAdminPath(role: UserRole | undefined | null, pathname: string): boolean {
  if (!isLimitedRole(role)) return true;
  return LIMITED_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** İçerik sahibi (`schemaAttributes._ownerId`); sunucu yazar, istemci değeri yok sayılır. Eski içerikte yoktur. */
export const contentOwnerId = (schemaAttributes: unknown): string | null => {
  const v = (schemaAttributes as { _ownerId?: unknown } | null | undefined)?._ownerId;
  return typeof v === "string" && v ? v : null;
};

export interface ContentAccess {
  /** Düzenleyebilir mi. */
  edit: boolean;
  /** İstenen duruma (`published`, `scheduled`) kaydedebilir mi; yoksa taslağa düşer. */
  publish: boolean;
}

/**
 * Bir içeriğe erişim kuralı. `existing` yoksa yeni içeriktir. Katkıcı yalnızca kendi taslağını düzenler
 * (yayına alınmış içerik editöre geçer); yazar kendi içeriğini her durumda düzenler.
 */
export function contentAccess(
  role: UserRole,
  userId: string,
  existing: { schemaAttributes?: unknown; status: string } | null
): ContentAccess {
  const publish = roleCan(role, "content.publish");
  if (roleCan(role, "content.editAny")) return { edit: true, publish };
  if (!existing) return { edit: roleCan(role, "content.create"), publish };
  const own = contentOwnerId(existing.schemaAttributes) === userId;
  if (!own || !roleCan(role, "content.editOwn")) return { edit: false, publish };
  // Yayın yetkisi olmayan rol yayındaki/zamanlanmış içeriği artık düzenleyemez
  if (!publish && existing.status !== "draft") return { edit: false, publish };
  return { edit: true, publish };
}
