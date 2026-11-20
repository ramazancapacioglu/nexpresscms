"use client";

import React, { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ExternalLink, Plus, ShieldAlert } from "lucide-react";
import { loadCrawlHygieneAction, saveCrawlHygieneAction, type CrawlHygieneView } from "@/app/admin/seo/crawl-hygiene-actions";
import { formatValue } from "./format";

const input = "v-ink w-full rounded-md border bg-transparent px-2 py-1.5 text-[12px] font-mono";

/**
 * Tarama temizliği: spam ya da artık adresler arama motorlarında dizinleniyor ve tarama bütçesini yiyorsa, bu adresler
 * 410 (kalıcı silindi) cevabı alır; bilinmeyen sorgu parametreli sayfalar dizinlenmez. Kalıplar bulunamayan adres günlüğünden önerilir.
 */
export function CrawlHygienePanel() {
  const [view, setView] = useState<CrawlHygieneView | null>(null);
  const [rules, setRules] = useState("");
  const [params, setParams] = useState("");
  const [noindex, setNoindex] = useState(true);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    void loadCrawlHygieneAction().then((v) => {
      setView(v);
      setRules(v.hygiene.goneRules.join("\n"));
      setParams(v.hygiene.goneParams.join(", "));
      setNoindex(v.hygiene.noindexUnknownParams);
    });
  }, []);

  const addRule = (pattern: string) => setRules((r) => (r.split("\n").map((x) => x.trim()).includes(pattern) ? r : `${r.trim()}${r.trim() ? "\n" : ""}${pattern}`));
  const save = () =>
    start(async () => {
      setNote(null);
      const res = await saveCrawlHygieneAction({ goneRules: rules, goneParams: params, noindexUnknownParams: noindex });
      if (res.ok) {
        setRules(res.hygiene.goneRules.join("\n"));
        setParams(res.hygiene.goneParams.join(", "));
        setNote({ ok: true, text: "Kaydedildi. Kurallar en geç 15 saniye içinde devreye girer." });
        setView(await loadCrawlHygieneAction());
      } else setNote({ ok: false, text: res.error });
    });

  return (
    <div className="space-y-3">
      <section className="v-card flex gap-3 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--v-s2)" }} aria-hidden="true" />
        <div className="space-y-1 text-[12px]">
          <h3 className="v-ink text-[13px] font-semibold">Spam ve artık adresleri dizinden temizleyin</h3>
          <p className="v-ink2">Bir saldırı ya da eski site kalıntısı, sitenizin alan adı altında binlerce sahte adres (ör. <code>/ajax/…</code>, <code>/products/detail/123</code>, <code>/?j=rastgele</code>) üretebilir. Arama motorları bunları dizinler ve tarama bütçesini harcar. Aşağıdaki kurallar bu adreslere <strong>410 Gone</strong> (kalıcı silindi) cevabı verir; 404'e göre daha hızlı dizinden düşürür. Bilinmeyen sorgu parametreli sayfalar da <code>noindex</code> alır.</p>
          <p className="v-ink2">Kuralları <strong>robots.txt ile engellemeyin</strong>: engellenen adres taranamaz, dizinden de düşmez. Düşüşü hızlandırmak için Search Console → Kaldırmalar ve Bing → Siteyi yönet → URL engelle ekranlarından önek bazlı kaldırma isteği de verebilirsiniz.</p>
        </div>
      </section>

      <section className="v-card p-4">
        <h4 className="v-ink text-[13px] font-semibold">En çok istenen bulunamayan adresler</h4>
        <p className="v-ink2 text-[11px]">Yol kalıbına göre gruplanmış 404 günlüğü ({view ? formatValue(view.total404, "int") : "…"} istek). Sitede olmaması gereken kalıpları 410 kuralına çevirin.</p>
        {!view ? (
          <div className="v-skel mt-2 h-24" aria-busy="true" />
        ) : view.groups.length === 0 ? (
          <p className="v-ink2 mt-2 text-[12px]">Günlükte bulunamayan adres yok.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="v-ink2"><tr><th className="py-1.5 pr-3">Kalıp</th><th className="py-1.5 pr-3 text-right">İstek</th><th className="py-1.5 pr-3 text-right">Farklı adres</th><th className="py-1.5 pr-3">Örnek</th><th className="py-1.5" /></tr></thead>
              <tbody>
                {view.groups.map((g) => (
                  <tr key={g.pattern} className="v-row v-ink border-t" style={{ borderColor: "var(--v-grid)" }}>
                    <td className="py-1.5 pr-3 font-mono">{g.pattern}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{formatValue(g.hits, "int")}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{formatValue(g.paths, "int")}</td>
                    <td className="max-w-[16rem] truncate py-1.5 pr-3 font-mono v-ink2" title={g.sample}>{g.sample}</td>
                    <td className="py-1.5 text-right">
                      {g.covered || rules.split("\n").map((x) => x.trim()).includes(g.pattern) ? (
                        <span className="v-ink2 text-[11px]">410 kuralı var</span>
                      ) : (
                        <button type="button" onClick={() => addRule(g.pattern)} className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium hover:bg-[var(--v-wash)]" style={{ borderColor: "var(--v-ring)" }}>
                          <Plus className="h-3 w-3" aria-hidden="true" /> 410 yap
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="v-card space-y-3 p-4">
        <h4 className="v-ink text-[13px] font-semibold">Kurallar</h4>
        <label className="block text-[11px]">
          <span className="v-ink2 font-semibold">410 verilecek yol kalıpları (satır başına bir tane)</span>
          <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={6} placeholder={"/ajax/*\n/products/detail/*\n/pc/index.php"} className={`${input} mt-1`} style={{ borderColor: "var(--v-ring)" }} />
          <span className="v-ink2 mt-0.5 block">* = herhangi bir devam. <code>/ajax/*</code> hem <code>/ajax</code> hem altındaki her adresi kapsar. Gerçek sayfalarınızı kapsamadığından emin olun.</span>
        </label>
        <label className="block text-[11px]">
          <span className="v-ink2 font-semibold">Taşıyan her isteğe 410 verilecek sorgu parametreleri (virgülle)</span>
          <input value={params} onChange={(e) => setParams(e.target.value)} placeholder="j" className={`${input} mt-1`} style={{ borderColor: "var(--v-ring)" }} />
          <span className="v-ink2 mt-0.5 block">Örn. spam bağlantılar <code>/?j=…</code> ile geliyorsa <code>j</code> yazın. Sitenin kendi kullandığı parametreleri (sayfa, q, utm_*) yazmayın.</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[12px]">
          <input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} />
          <span className="v-ink">Bilinmeyen sorgu parametreli sayfalara <code>noindex, follow</code> ver (önerilir)</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={save} disabled={pending} className="rounded-md bg-nx-primary px-3 py-1.5 text-[12px] font-semibold text-nx-primary-fg disabled:opacity-60">{pending ? "Kaydediliyor…" : "Kuralları kaydet"}</button>
          {note ? <span role={note.ok ? "status" : "alert"} className="inline-flex items-center gap-1 text-[12px]" style={{ color: note.ok ? "var(--v-good)" : "var(--v-bad)" }}>{note.ok ? null : <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}{note.text}</span> : null}
        </div>
      </section>

      <p className="v-ink2 text-[11px]">
        Geri bağlantı (backlink) spamı için: Search Console → Bağlantılar → "Dış bağlantılar"dan en çok bağlantı veren siteleri dışa aktarın; çok sayıda spam alan adı varsa Google'ın reddetme (disavow) aracını kullanabilirsiniz.{" "}
        <a href="https://search.google.com/search-console/remove-outdated-content" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Kaldırmalar <ExternalLink className="inline h-3 w-3" aria-hidden="true" /></a>
      </p>
    </div>
  );
}
