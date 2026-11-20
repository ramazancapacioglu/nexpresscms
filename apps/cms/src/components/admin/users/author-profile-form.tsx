"use client";

import React, { useState, useTransition } from "react";
import { AUTHOR_LIMITS, type AuthorProfile } from "@nexpress/core";
import { updateAuthorProfileAction, type ProfileResult } from "@/app/admin/profile/actions";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = `w-full rounded border ${border} bg-transparent px-2 py-1.5 text-[12px] outline-none focus:ring-1 focus:ring-[#266DF0]`;
const card = `rounded-lg border ${border} bg-white dark:bg-[#15171C] p-4 space-y-3`;
const hint = "block text-[11px] font-normal text-[#5F6570] dark:text-[#8C9099]";

/**
 * Yazar profili: yazı altında "Yazar" kutusu, `/yazar/<ad>` sayfası ve yazı şemasındaki `Person` (ünvan, biyografi, uzmanlık, sameAs) buradan gelir.
 * Hepsi isteğe bağlıdır; boş bırakılan alan hiçbir yerde gösterilmez ya da şemaya yazılmaz.
 */
export function AuthorProfileForm({ initial, authorPath }: { initial: AuthorProfile; authorPath: string }) {
  const [pending, start] = useTransition();
  const [jobTitle, setJobTitle] = useState(initial.jobTitle);
  const [bio, setBio] = useState(initial.bio);
  const [expertise, setExpertise] = useState(initial.expertise.join(", "));
  const [sameAs, setSameAs] = useState(initial.sameAs.join("\n"));
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [result, setResult] = useState<ProfileResult | null>(null);

  return (
    <section className={card}>
      <div>
        <h2 className="text-[13px] font-bold">Yazar profili</h2>
        <p className={hint}>Yazı altındaki yazar kutusunda, <a className="underline" href={authorPath}>yazar sayfanızda</a> ve arama motorlarına verilen yazar bilgisinde (Person şeması) görünür. Yalnızca gerçek bilgileri yazın.</p>
      </div>
      <label className="block space-y-1 text-[12px] font-medium">Ünvan / rol
        <input value={jobTitle} maxLength={AUTHOR_LIMITS.jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Örn. Yazılım Danışmanı" className={`${field} h-8`} />
      </label>
      <label className="block space-y-1 text-[12px] font-medium">Kısa biyografi
        <textarea value={bio} rows={4} maxLength={AUTHOR_LIMITS.bio} onChange={(e) => setBio(e.target.value)} className={field} />
        <span className={hint}>{bio.length}/{AUTHOR_LIMITS.bio} • Uzmanlığınızı ve deneyiminizi anlatan 2–3 cümle.</span>
      </label>
      <label className="block space-y-1 text-[12px] font-medium">Uzmanlık alanları
        <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="ERP, e-Fatura, Muhasebe" className={`${field} h-8`} />
        <span className={hint}>Virgülle ayırın, en çok {AUTHOR_LIMITS.expertiseItems} alan.</span>
      </label>
      <label className="block space-y-1 text-[12px] font-medium">Profil bağlantıları (sameAs)
        <textarea value={sameAs} rows={3} onChange={(e) => setSameAs(e.target.value)} placeholder={"https://www.linkedin.com/in/...\nhttps://x.com/..."} className={field} />
        <span className={hint}>LinkedIn, X, GitHub gibi kendi profilleriniz; satır başına bir https adresi.</span>
      </label>
      <label className="block space-y-1 text-[12px] font-medium">Avatar
        <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="/media/med_… (medya kitaplığından kopyalayın) ya da https adresi" className={`${field} h-8`} />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await updateAuthorProfileAction({ jobTitle, bio, expertise, sameAs, avatarUrl });
              setResult(res);
              if (res.ok && res.profile) {
                setJobTitle(res.profile.jobTitle);
                setBio(res.profile.bio);
                setExpertise(res.profile.expertise.join(", "));
                setSameAs(res.profile.sameAs.join("\n"));
                setAvatarUrl(res.profile.avatarUrl);
              }
            })
          }
          className="h-8 rounded bg-[#266DF0] px-3 text-[12px] font-medium text-white disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Profili kaydet"}
        </button>
        {result ? (result.ok ? <p role="status" className="text-[11px] text-emerald-800">Kaydedildi.</p> : <p role="alert" className="text-[11px] text-red-600">{result.error}</p>) : null}
      </div>
    </section>
  );
}
