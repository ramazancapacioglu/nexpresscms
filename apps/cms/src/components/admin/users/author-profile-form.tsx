"use client";

import React, { useMemo, useState, useTransition } from "react";
import { AUTHOR_LIMITS, type AuthorProfile, type AuthorSchemaType } from "@nexpress/core";
import type { UserSummaryDto } from "@nexpress/database";
import { updateAuthorProfileAction, type ProfileResult } from "@/app/admin/profile/actions";
import { updateUserAuthorProfileAction } from "@/app/admin/users/actions";
import { ExternalLink, Globe, UserCheck, Building2 } from "lucide-react";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = `w-full rounded border ${border} bg-transparent px-2.5 py-1.5 text-[12px] outline-none focus:ring-1 focus:ring-[#266DF0]`;
const card = `rounded-lg border ${border} bg-white dark:bg-[#15171C] p-4 space-y-3.5`;
const hint = "block text-[11px] font-normal text-[#5F6570] dark:text-[#8C9099]";

interface SocialBucket {
  linkedin: string;
  x: string;
  instagram: string;
  youtube: string;
  facebook: string;
  github: string;
  extra: string;
}

function splitSocialUrls(urls: string[]): SocialBucket {
  const bucket: SocialBucket = { linkedin: "", x: "", instagram: "", youtube: "", facebook: "", github: "", extra: "" };
  const extras: string[] = [];
  for (const raw of urls) {
    const u = raw.trim();
    if (!u) continue;
    let host = "";
    try {
      host = new URL(u).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      extras.push(u);
      continue;
    }
    if (!bucket.linkedin && (host === "linkedin.com" || host.endsWith(".linkedin.com"))) bucket.linkedin = u;
    else if (!bucket.x && (host === "x.com" || host === "twitter.com")) bucket.x = u;
    else if (!bucket.instagram && host === "instagram.com") bucket.instagram = u;
    else if (!bucket.youtube && (host === "youtube.com" || host === "youtu.be")) bucket.youtube = u;
    else if (!bucket.facebook && host === "facebook.com") bucket.facebook = u;
    else if (!bucket.github && host === "github.com") bucket.github = u;
    else extras.push(u);
  }
  bucket.extra = extras.join("\n");
  return bucket;
}

function mergeSocialUrls(b: SocialBucket): string {
  return [
    b.linkedin,
    b.x,
    b.instagram,
    b.youtube,
    b.facebook,
    b.github,
    ...b.extra.split(/\r?\n/),
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");
}

interface AuthorProfileFormProps {
  initial: AuthorProfile;
  authorPath: string;
  /** Yönetici `/admin/users` ekranından başka bir kullanıcıyı düzenlerken verilir. */
  userId?: string;
  userName?: string;
  compact?: boolean;
  onSaved?: (updated: { user?: UserSummaryDto; profile: AuthorProfile }) => void;
}

/**
 * Şema uyumlu Yazar & Uzmanlık Profili Editörü:
 * `/yazar/<slug>` profil sayfası, yazı altındaki yazar kutusu ve JSON-LD (`Person` / `Organization`, `jobTitle`, `description`, `knowsAbout`, `hasCredential`, `sameAs`, `image`) buradan beslenir.
 */
export function AuthorProfileForm({ initial, authorPath, userId, userName, compact, onSaved }: AuthorProfileFormProps) {
  const [pending, start] = useTransition();
  const [displayName, setDisplayName] = useState(userName ?? "");
  const [authorType, setAuthorType] = useState<AuthorSchemaType>(initial.authorType ?? "Person");
  const [jobTitle, setJobTitle] = useState(initial.jobTitle);
  const [bio, setBio] = useState(initial.bio);
  const [expertise, setExpertise] = useState(initial.expertise.join(", "));
  const [credentials, setCredentials] = useState((initial.credentials ?? []).join("\n"));
  const [social, setSocial] = useState<SocialBucket>(() => splitSocialUrls(initial.sameAs));
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [result, setResult] = useState<ProfileResult | null>(null);

  const expertiseTags = useMemo(
    () => expertise.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, AUTHOR_LIMITS.expertiseItems),
    [expertise]
  );

  const setSocialField = (key: keyof SocialBucket, value: string) =>
    setSocial((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    start(async () => {
      const sameAsText = mergeSocialUrls(social);
      const res = userId
        ? await updateUserAuthorProfileAction({
            id: userId,
            name: displayName,
            authorType,
            jobTitle,
            bio,
            expertise,
            credentials,
            sameAs: sameAsText,
            avatarUrl,
          })
        : await updateAuthorProfileAction({
            authorType,
            jobTitle,
            bio,
            expertise,
            credentials,
            sameAs: sameAsText,
            avatarUrl,
          });
      setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
      if (res.ok && res.profile) {
        setAuthorType(res.profile.authorType);
        setJobTitle(res.profile.jobTitle);
        setBio(res.profile.bio);
        setExpertise(res.profile.expertise.join(", "));
        setCredentials(res.profile.credentials.join("\n"));
        setSocial(splitSocialUrls(res.profile.sameAs));
        setAvatarUrl(res.profile.avatarUrl);
        onSaved?.({ user: "user" in res ? (res.user as UserSummaryDto | undefined) : undefined, profile: res.profile });
      }
    });
  };

  return (
    <section className={compact ? "space-y-3.5" : card}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[13px] font-bold">Yazar &amp; Uzmanlık Profili (E-E-A-T / Schema.org)</h2>
          <p className={hint}>
            Yazı altındaki yazar kutusunda, profil sayfasında ve JSON-LD şemasında (<code className="font-mono">{authorType}</code>) yayınlanır. Yalnızca gerçek bilgileri girin.
          </p>
        </div>
        <a
          href={authorPath}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex h-7 items-center gap-1 rounded border ${border} px-2.5 text-[11px] font-medium hover:bg-muted/50`}
        >
          <span>Profil sayfasını aç</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Üst Satır: Yazar Türü + (Admin modunda) Görünen Ad + Ünvan */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1 text-[12px] font-medium">
          <span>Şema Türü (@type)</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setAuthorType("Person")}
              className={`flex h-8 items-center justify-center gap-1.5 rounded border text-[11px] font-medium transition ${
                authorType === "Person"
                  ? "border-[#266DF0] bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]"
                  : `${border} hover:bg-muted/40`
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Kişi (Person)
            </button>
            <button
              type="button"
              onClick={() => setAuthorType("Organization")}
              className={`flex h-8 items-center justify-center gap-1.5 rounded border text-[11px] font-medium transition ${
                authorType === "Organization"
                  ? "border-[#266DF0] bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]"
                  : `${border} hover:bg-muted/40`
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Kurum (Org)
            </button>
          </div>
          <span className={hint}>Kurumsal yayın ekipleri için Kurum seçin.</span>
        </div>

        {userId ? (
          <label className="block space-y-1 text-[12px] font-medium">
            Görünen Ad
            <input
              value={displayName}
              maxLength={80}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ad Soyad veya Kurum Adı"
              className={`${field} h-8`}
            />
          </label>
        ) : null}

        <label className="block space-y-1 text-[12px] font-medium">
          Ünvan / Rol (jobTitle)
          <input
            value={jobTitle}
            maxLength={AUTHOR_LIMITS.jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder={authorType === "Organization" ? "Örn. Yetkili Çözüm Merkezi" : "Örn. ERP ve Kurumsal Yazılım Uzmanı"}
            className={`${field} h-8`}
          />
        </label>
      </div>

      {/* Biyografi */}
      <label className="block space-y-1 text-[12px] font-medium">
        Biyografi &amp; Uzmanlık İçeriği (description)
        <textarea
          value={bio}
          rows={4}
          maxLength={AUTHOR_LIMITS.bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Uzmanlığınızı, saha deneyiminizi ve okuyuculara hangi konularda rehberlik ettiğinizi anlatın…"
          className={field}
        />
        <span className={hint}>
          {bio.length}/{AUTHOR_LIMITS.bio} karakter • Profil sayfasında ve yapılandırılmış veride (description) gösterilir.
        </span>
      </label>

      {/* Uzmanlık Alanları + Sertifikalar */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block space-y-1 text-[12px] font-medium">
            Uzmanlık Alanları (knowsAbout)
            <input
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="Wolvox ERP, e-Dönüşüm, Ticari Otomasyon, Veritabanı"
              className={`${field} h-8`}
            />
            <span className={hint}>Virgülle ayırın, en çok {AUTHOR_LIMITS.expertiseItems} alan.</span>
          </label>
          {expertiseTags.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {expertiseTags.map((tag) => (
                <span key={tag} className={`rounded-full border ${border} bg-muted/40 px-2 py-0.5 text-[10px]`}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <label className="block space-y-1 text-[12px] font-medium">
          Mesleki Belgeler &amp; Sertifikalar (hasCredential)
          <textarea
            value={credentials}
            rows={3}
            onChange={(e) => setCredentials(e.target.value)}
            placeholder={"Akınsoft Yetkili Çözüm Ortağı\nWolvox ERP Uygulama Uzmanı"}
            className={field}
          />
          <span className={hint}>Satır başına bir belge veya yetkinlik (en çok {AUTHOR_LIMITS.credentialItems}).</span>
        </label>
      </div>

      {/* Sosyal Medya & Doğrulanmış Profiller (sameAs) */}
      <div className={`rounded-md border ${border} bg-[#FBFBFB] dark:bg-[#121317] p-3 space-y-2.5`}>
        <div className="flex items-center gap-1.5 text-[12px] font-semibold">
          <Globe className="h-3.5 w-3.5 text-[#266DF0]" />
          <span>Sosyal Medya &amp; Profil Bağlantıları (sameAs)</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block space-y-0.5 text-[11px] font-medium">
            LinkedIn
            <input value={social.linkedin} onChange={(e) => setSocialField("linkedin", e.target.value)} placeholder="https://www.linkedin.com/in/..." className={`${field} h-8`} />
          </label>
          <label className="block space-y-0.5 text-[11px] font-medium">
            X (Twitter)
            <input value={social.x} onChange={(e) => setSocialField("x", e.target.value)} placeholder="https://x.com/..." className={`${field} h-8`} />
          </label>
          <label className="block space-y-0.5 text-[11px] font-medium">
            Instagram
            <input value={social.instagram} onChange={(e) => setSocialField("instagram", e.target.value)} placeholder="https://www.instagram.com/..." className={`${field} h-8`} />
          </label>
          <label className="block space-y-0.5 text-[11px] font-medium">
            YouTube
            <input value={social.youtube} onChange={(e) => setSocialField("youtube", e.target.value)} placeholder="https://www.youtube.com/@..." className={`${field} h-8`} />
          </label>
          <label className="block space-y-0.5 text-[11px] font-medium">
            Facebook
            <input value={social.facebook} onChange={(e) => setSocialField("facebook", e.target.value)} placeholder="https://www.facebook.com/..." className={`${field} h-8`} />
          </label>
          <label className="block space-y-0.5 text-[11px] font-medium">
            GitHub
            <input value={social.github} onChange={(e) => setSocialField("github", e.target.value)} placeholder="https://github.com/..." className={`${field} h-8`} />
          </label>
        </div>
        <label className="block space-y-0.5 text-[11px] font-medium">
          Diğer Web / Profil Bağlantıları (isteğe bağlı, satır başına bir https:// adresi)
          <textarea
            value={social.extra}
            rows={2}
            onChange={(e) => setSocialField("extra", e.target.value)}
            placeholder="https://dijitalevre.com"
            className={field}
          />
        </label>
      </div>

      {/* Avatar */}
      <div className="flex items-end gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar önizleme"
            className={`h-11 w-11 shrink-0 rounded-full border ${border} object-cover`}
          />
        ) : null}
        <label className="block flex-1 space-y-1 text-[12px] font-medium">
          Profil Fotoğrafı / Logo (image)
          <input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="/media/med_… (medya kitaplığından kopyalayın) ya da https:// adresi"
            className={`${field} h-8`}
          />
        </label>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={handleSave}
          className="h-8 rounded bg-[#266DF0] px-3.5 text-[12px] font-medium text-white hover:bg-[#1D5ED8] disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Profili kaydet"}
        </button>
        {result ? (
          result.ok ? (
            <p role="status" className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              Profil kaydedildi ve şemalar güncellendi.
            </p>
          ) : (
            <p role="alert" className="text-[11px] font-medium text-red-600 dark:text-red-400">
              {result.error}
            </p>
          )
        ) : null}
      </div>
    </section>
  );
}
