import React from "react";
import { getAuditRepository } from "@nexpress/database";
import { AuditTools } from "@/components/admin/audit-tools";
import { requireAdminPage } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const border = "border-[#E6E7EA] dark:border-[#23262E]";
const DOMAINS = [
  ["", "Tümü"],
  ["auth.", "Giriş / oturum"],
  ["user.", "Kullanıcılar"],
  ["cms.", "İçerik & tasarım"],
  ["commerce.", "E-ticaret"],
  ["marketplace.", "Pazar yerleri"],
  ["settings.", "Ayarlar"],
] as const;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; action?: string; from?: string; to?: string; page?: string }>;
}) {
  const me = await requireAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const day = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  const from = day(sp.from);
  const to = day(sp.to);
  const filter = {
    actorEmail: sp.actor?.trim() || undefined,
    actionPrefix: sp.action?.trim() || undefined,
    since: from ? new Date(`${from}T00:00:00.000Z`) : undefined,
    until: to ? new Date(`${to}T23:59:59.999Z`) : undefined,
  };
  const repo = getAuditRepository(me.siteId);
  const [rows, total] = await Promise.all([
    repo.list({ ...filter, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    repo.count(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const params = () => {
    const q = new URLSearchParams();
    if (filter.actorEmail) q.set("actor", filter.actorEmail);
    if (filter.actionPrefix) q.set("action", filter.actionPrefix);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return q;
  };
  const qs = (p: number) => {
    const q = params();
    q.set("page", String(p));
    return `/admin/audit?${q}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[16px] font-bold tracking-tight">Denetim Günlüğü</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Kim, ne zaman, hangi işlemi yaptı. Kayıtlar yetkilendirilmiş çağrıları gösterir (işlemin başarısı ayrıca garanti edilmez); parola ve sır yazılmaz. Yalnızca eklenir.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2 text-[12px]">
        <label className="space-y-1">
          <span className="block text-[10px] uppercase text-[#5F6570] dark:text-[#8C9099]">Kullanıcı (e-posta)</span>
          <input name="actor" defaultValue={filter.actorEmail} className={`h-8 rounded border ${border} bg-transparent px-2`} />
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] uppercase text-[#5F6570] dark:text-[#8C9099]">Alan</span>
          <select name="action" defaultValue={filter.actionPrefix ?? ""} className={`h-8 rounded border ${border} bg-transparent px-2`}>
            {DOMAINS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] uppercase text-[#5F6570] dark:text-[#8C9099]">Başlangıç</span>
          <input type="date" name="from" defaultValue={from} className={`h-8 rounded border ${border} bg-transparent px-2`} />
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] uppercase text-[#5F6570] dark:text-[#8C9099]">Bitiş</span>
          <input type="date" name="to" defaultValue={to} className={`h-8 rounded border ${border} bg-transparent px-2`} />
        </label>
        <button type="submit" className="h-8 rounded bg-[#266DF0] px-3 font-medium text-white">Filtrele</button>
        <span className="pb-2 text-[11px] text-[#5F6570] dark:text-[#8C9099]">{total.toLocaleString("tr-TR")} kayıt</span>
      </form>

      <AuditTools exportHref={`/api/admin/audit/export?${params()}`} total={total} />

      <div className={`overflow-x-auto rounded-lg border ${border} bg-white dark:bg-[#15171C]`} tabIndex={0} role="region" aria-label="Kaydırılabilir alan">
        <table className="w-full text-[12px]">
          <thead className="bg-[#FBFBFB] dark:bg-[#121317] text-left text-[10px] uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">
            <tr><th className="px-3 py-2">Zaman</th><th className="px-3 py-2">Kullanıcı</th><th className="px-3 py-2">Eylem</th><th className="px-3 py-2">Hedef / ayrıntı</th><th className="px-3 py-2">IP</th></tr>
          </thead>
          <tbody className="divide-y divide-[#E6E7EA] dark:divide-[#23262E]">
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-[#5F6570] dark:text-[#8C9099]">Bu filtreyle kayıt yok.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">{new Date(r.at).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "medium" })}</td>
                <td className="px-3 py-2">{r.actorEmail || <span className="text-[#5F6570] dark:text-[#8C9099]">anonim</span>}</td>
                <td className="px-3 py-2 font-mono text-[11px]">{r.action}</td>
                <td className="px-3 py-2 text-[#5C5F66] dark:text-[#9CA3AF]">{[r.target, r.detail].filter(Boolean).join(" — ") || "—"}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-[#5F6570] dark:text-[#8C9099]">{r.ip || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="flex items-center gap-3 text-[12px]" aria-label="Sayfalama">
        {page > 1 && <a className="underline" href={qs(page - 1)}>← Yeni</a>}
        <span className="text-[#5F6570] dark:text-[#8C9099]">Sayfa {page} / {pages}</span>
        {page < pages && <a className="underline" href={qs(page + 1)}>Eski →</a>}
      </nav>
    </div>
  );
}
