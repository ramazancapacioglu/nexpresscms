"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MAX_MEMBER_TIERS, MEMBERSHIP_MODES, MEMBERSHIP_MODE_LABEL, suggestTierId, type MembershipMode, type MembershipSettings, type MembershipTier } from "@nexpress/core";
import { deleteMemberAction, inviteMemberAction, saveMembershipSettingsAction, setMemberStatusAction, setMemberTierAction } from "./actions";

export interface MemberView {
  id: string;
  email: string;
  name: string;
  status: "active" | "pending" | "disabled";
  tier: string;
  verified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = "h-8 w-full rounded border border-[#E6E7EA] bg-white px-2 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]";
const STATUS = { active: "Etkin", pending: "Doğrulama bekliyor", disabled: "Devre dışı" } as const;

export function MembersPanel({ members, settings, mailReady }: { members: MemberView[]; settings: MembershipSettings; mailReady: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<MembershipMode>(settings.mode);
  const [privacyUrl, setPrivacyUrl] = useState(settings.privacyUrl);
  const [tiers, setTiers] = useState<MembershipTier[]>(settings.tiers);
  const [invite, setInvite] = useState({ email: "", name: "" });
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, okText: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      setNote({ ok: res.ok, text: res.ok ? (res.message ?? okText) : (res.error ?? "İşlem başarısız.") });
      if (res.ok) {
        after?.();
        router.refresh();
      }
    });

  return (
    <div className="space-y-5">
      <header className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3`}>
        <div>
          <h1 className="text-[18px] font-semibold">Ziyaretçi üyeleri</h1>
          <p className="max-w-[70ch] text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            Üyeler panele giremez; yalnızca &quot;üyelere özel&quot; yayın görünürlüğündeki içeriği açar. Giriş parolasızdır: e-postaya tek kullanımlık, 15 dakikalık bağlantı gider. Ziyaretçi giriş sayfası: <code>/uye/giris</code>.
          </p>
        </div>
      </header>

      {!mailReady ? <p role="alert" className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-800 dark:text-amber-200">E-posta gönderimi kurulu değil. Giriş bağlantıları e-postayla gittiği için üyelik, Ayarlar › E-posta kurulmadan açılamaz.</p> : null}

      <section className={`space-y-3 rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`}>
        <h2 className="text-[13px] font-semibold">Kayıt politikası</h2>
        <div className="flex flex-col gap-1.5">
          {MEMBERSHIP_MODES.map((m) => (
            <label key={m} className="inline-flex items-center gap-2 text-[12px]"><input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} /> {MEMBERSHIP_MODE_LABEL[m]}</label>
          ))}
        </div>
        <label className="block max-w-xl text-[11px] font-medium">Aydınlatma metni adresi (KVKK; kayıt formunda bağlantı olarak görünür)
          <input aria-label="Aydınlatma adresi" className={field} value={privacyUrl} maxLength={300} onChange={(e) => setPrivacyUrl(e.target.value)} placeholder="/gizlilik ya da https://…" />
        </label>
        <div className="space-y-2 border-t border-[#E6E7EA] pt-3 dark:border-[#23262E]">
          <div className="text-[11px] font-semibold">Üyelik kademeleri <span className="font-normal text-[#8C9099]">(düşükten yükseğe; boşsa tek düzey üyelik. İçerik &quot;Gereken kademe&quot; seçer, yüksek kademe düşüğün içeriğini de açar.)</span></div>
          {tiers.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2">
              <span className="w-5 text-right font-mono text-[11px] text-[#8C9099]">{i + 1}</span>
              <input aria-label={`Kademe ${i + 1} adı`} className={`${field} max-w-xs`} value={t.label} maxLength={30} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <span className="font-mono text-[10px] text-[#8C9099]">{t.id}</span>
              <button type="button" aria-label="Yukarı" disabled={i === 0} onClick={() => { const n = [...tiers]; [n[i - 1], n[i]] = [n[i]!, n[i - 1]!]; setTiers(n); }} className="px-1 text-[12px] disabled:opacity-30">↑</button>
              <button type="button" aria-label="Aşağı" disabled={i === tiers.length - 1} onClick={() => { const n = [...tiers]; [n[i + 1], n[i]] = [n[i]!, n[i + 1]!]; setTiers(n); }} className="px-1 text-[12px] disabled:opacity-30">↓</button>
              <button type="button" aria-label="Kademeyi kaldır" onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="text-[12px] text-red-600">Kaldır</button>
            </div>
          ))}
          {tiers.length < MAX_MEMBER_TIERS ? (
            <button type="button" onClick={() => { const n = tiers.length + 1; const label = `Kademe ${n}`; setTiers([...tiers, { id: suggestTierId(`${label}-${Date.now().toString(36).slice(-3)}`), label }]); }} className="text-[12px] font-medium text-[#266DF0]">+ Kademe ekle</button>
          ) : null}
        </div>
        <button type="button" disabled={pending} onClick={() => run(() => saveMembershipSettingsAction({ mode, privacyUrl, tiers: tiers.filter((t) => t.label.trim()) }), "Kaydedildi.")} className="h-8 rounded-md bg-[#14151A] px-4 text-[12px] font-medium text-white disabled:opacity-60 dark:bg-[#F3F4F6] dark:text-[#14151A]">Kaydet</button>
      </section>

      <section className={`space-y-3 rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`}>
        <h2 className="text-[13px] font-semibold">Üye davet et</h2>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input aria-label="Davet e-postası" type="email" className={field} value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="E-posta" />
          <input aria-label="Davet adı" className={field} value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="Ad (isteğe bağlı)" />
          <button type="button" disabled={pending || !invite.email} onClick={() => run(() => inviteMemberAction(invite), "Davet gönderildi.", () => setInvite({ email: "", name: "" }))} className="h-8 rounded-md bg-[#266DF0] px-3 text-[12px] font-semibold text-white disabled:opacity-50">Davet gönder</button>
        </div>
      </section>

      {note ? <p role="status" className={`text-[12px] ${note.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600"}`}>{note.text}</p> : null}

      {members.length === 0 ? (
        <p className={`rounded-lg border border-dashed ${border} p-8 text-center text-[12px] text-[#5F6570]`}>Henüz üye yok.</p>
      ) : (
        <div className={`overflow-x-auto rounded-lg border ${border} bg-white dark:bg-[#15171C]`}>
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#5F6570] dark:bg-[#111318]">
              <tr><th className="px-3 py-2">E-posta</th><th className="px-3 py-2">Durum</th>{settings.tiers.length > 0 ? <th className="px-3 py-2">Kademe</th> : null}<th className="px-3 py-2">Kayıt</th><th className="px-3 py-2">Son giriş</th><th className="px-3 py-2" /></tr>
            </thead>
            <tbody className={`divide-y ${border}`}>
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2"><div className="font-medium">{m.email}</div>{m.name ? <div className="text-[11px] text-[#8C9099]">{m.name}</div> : null}</td>
                  <td className="px-3 py-2">{STATUS[m.status]}</td>
                  {settings.tiers.length > 0 ? (
                    <td className="px-3 py-2">
                      <select aria-label={`${m.email} kademesi`} disabled={pending} value={m.tier} onChange={(e) => run(() => setMemberTierAction({ id: m.id, tier: e.target.value }), "Kademe güncellendi.")} className="h-7 rounded border border-[#E6E7EA] bg-transparent px-1 text-[11px] dark:border-[#23262E]">
                        <option value="">—</option>
                        {settings.tiers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </td>
                  ) : null}
                  <td className="px-3 py-2 text-[#5F6570]">{m.createdAt}</td>
                  <td className="px-3 py-2 text-[#5F6570]">{m.lastLoginAt ?? "—"}</td>
                  <td className="space-x-3 px-3 py-2 text-right">
                    {m.status === "disabled" ? (
                      <button type="button" disabled={pending} onClick={() => run(() => setMemberStatusAction({ id: m.id, status: "active" }), "Üye etkinleştirildi.")} className="text-[#266DF0] hover:underline disabled:opacity-50">Etkinleştir</button>
                    ) : (
                      <button type="button" disabled={pending} onClick={() => run(() => setMemberStatusAction({ id: m.id, status: "disabled" }), "Üye devre dışı bırakıldı.")} className="text-[#266DF0] hover:underline disabled:opacity-50">Devre dışı bırak</button>
                    )}
                    <button type="button" disabled={pending} onClick={() => { if (window.confirm(`${m.email} kalıcı olarak silinsin mi?`)) run(() => deleteMemberAction({ id: m.id }), "Üye silindi."); }} className="text-red-600 hover:underline disabled:opacity-50">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
