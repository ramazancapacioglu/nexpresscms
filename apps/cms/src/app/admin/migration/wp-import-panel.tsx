"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FileUp } from "lucide-react";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const card = `rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`;

interface Summary {
  siteTitle: string;
  baseUrl: string;
  totals: { posts: number; pages: number; products: number; drafts: number; attachments: number; shortcodes: number };
  importing: number;
  terms: number;
  images: number;
  skipped: Record<string, number>;
  warnings: string[];
  itemWarnings: Array<{ title: string; warnings: string[] }>;
  sample: Array<{ title: string; type: string; status: string; slug: string; blocks: number }>;
  locale: string;
}
interface Report {
  created: number;
  updated: number;
  skippedExisting: number;
  failed: Array<{ title: string; error: string }>;
  terms: { created: number };
  redirects: { created: number; skipped: number };
  images: { downloaded: number; failed: number; skippedOverLimit: number };
  warnings: string[];
}
type Opts = { post: boolean; page: boolean; product: boolean; includeDrafts: boolean; createRedirects: boolean; downloadImages: boolean; update: boolean };
interface ShellSummary {
  title: string;
  description: string;
  phone: string;
  email: string;
  primary: string;
  accent: string;
  menu: string[];
  footerColumns: number;
  blocks: Record<string, number>;
  blockCount: number;
  warnings: string[];
  locale: string;
}

export function WpImportPanel() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [o, setO] = useState<Opts>({ post: true, page: true, product: true, includeDrafts: true, createRedirects: true, downloadImages: false, update: false });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "analyze" | "run">("");
  const [shellUrl, setShellUrl] = useState("https://www.akinsoftizmir.com.tr/");
  const [shell, setShell] = useState<ShellSummary | null>(null);
  const [shellError, setShellError] = useState("");
  const [shellBusy, setShellBusy] = useState(false);

  const send = async (mode: "analyze" | "run") => {
    const body = new FormData();
    body.set("file", file!);
    body.set("mode", mode);
    body.set("types", (["post", "page", "product"] as const).filter((t) => o[t]).join(",") || "none");
    for (const k of ["includeDrafts", "createRedirects", "downloadImages", "update"] as const) body.set(k, o[k] ? "1" : "0");
    const res = await fetch("/api/admin/wp-import", { method: "POST", body });
    return (await res.json()) as { ok: true; summary?: Summary; report?: Report } | { ok: false; error: string };
  };

  useEffect(() => {
    if (!file) return;
    let live = true;
    setBusy("analyze");
    setReport(null);
    send("analyze")
      .then((r) => {
        if (!live) return;
        if (r.ok) { setSummary(r.summary ?? null); setErrors([]); }
        else { setSummary(null); setErrors([r.error]); }
      })
      .catch(() => live && setErrors(["Çözümleme tamamlanamadı."]))
      .finally(() => live && setBusy(""));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, o.post, o.page, o.product, o.includeDrafts]);

  const run = async () => {
    setBusy("run");
    setErrors([]);
    try {
      const r = await send("run");
      if (r.ok && r.report) setReport(r.report);
      else if (!r.ok) setErrors([r.error]);
    } catch {
      setErrors(["İçe aktarma tamamlanamadı; sonucu içerik listesinden kontrol edin."]);
    } finally {
      setBusy("");
    }
  };

  const readShell = async () => {
    setShellBusy(true);
    setShellError("");
    setShell(null);
    try {
      const res = await fetch("/api/admin/wp-shell", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: shellUrl }) });
      const data = (await res.json()) as { ok: true; summary: ShellSummary } | { ok: false; error: string };
      if (data.ok) setShell(data.summary);
      else setShellError(data.error);
    } catch {
      setShellError("Sayfa okunamadı.");
    } finally {
      setShellBusy(false);
    }
  };

  const check = (k: keyof Opts, label: React.ReactNode, hint?: string) => (
    <label className="flex items-start gap-2 text-[12px]">
      <input type="checkbox" checked={o[k]} onChange={(e) => setO((s) => ({ ...s, [k]: e.target.checked }))} className="mt-0.5" />
      <span>{label}{hint && <span className="block text-[11px] text-[#5F6570] dark:text-[#8C9099]">{hint}</span>}</span>
    </label>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <section className={card}>
          <h2 className="text-[13px] font-semibold">1. Dışa aktarma dosyası</h2>
          <button type="button" onClick={() => input.current?.click()} disabled={busy !== ""} className={`mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border ${border} px-3 text-[12px] font-medium hover:bg-[#F4F5F7] disabled:opacity-50 dark:hover:bg-[#1C1E24]`}>
            <FileUp className="h-3.5 w-3.5" /> {file ? file.name : "WordPress .xml dosyası seç"}
          </button>
          <input ref={input} type="file" accept=".xml,text/xml,application/xml" hidden onChange={(e) => { setFile(e.target.files?.[0] ?? null); setSummary(null); setReport(null); }} />
          {busy === "analyze" && <p className="mt-2 text-[12px] text-[#5F6570] dark:text-[#8C9099]">Çözümleniyor…</p>}
          {errors.length > 0 && <ul role="alert" className="mt-2 list-disc pl-5 text-[12px] text-red-600">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
        </section>

        {summary && (
          <section className={`${card} space-y-3 text-[12px]`}>
            <h2 className="text-[13px] font-semibold">2. Çözümleme sonucu {summary.siteTitle && <span className="font-normal text-[#5F6570] dark:text-[#8C9099]">— {summary.siteTitle}</span>}</h2>
            <p><strong>{summary.importing}</strong> içerik aktarılacak: {summary.totals.posts} yazı, {summary.totals.pages} sayfa, {summary.totals.products} ürün ({summary.totals.drafts} taslak). {summary.terms} kategori/etiket, {summary.images} görsel adresi, {summary.totals.shortcodes} kısa kod/işaretleme temizlendi. Dil: <code>{summary.locale}</code>.</p>
            {Object.keys(summary.skipped).length > 0 && <p className="text-[#5C5F66] dark:text-[#9CA3AF]">Atlananlar: {Object.entries(summary.skipped).map(([k, v]) => `${k} (${v})`).join(" · ")}</p>}
            {summary.warnings.map((w, i) => <p key={i} className="text-amber-800 dark:text-amber-300">{w}</p>)}
            {summary.sample.length > 0 && (
              <ul className={`divide-y rounded-md border ${border} ${border.replace("border-", "divide-")}`}>
                {summary.sample.map((s, i) => <li key={i} className="flex justify-between gap-3 px-3 py-1.5"><span className="truncate">{s.title}</span><span className="shrink-0 text-[#5F6570] dark:text-[#8C9099]">{s.type} · {s.status} · {s.blocks} blok · /{summary.locale}/{s.slug}</span></li>)}
              </ul>
            )}
            {summary.itemWarnings.length > 0 && (
              <details><summary className="cursor-pointer text-[#5C5F66]">İçerik uyarıları ({summary.itemWarnings.length})</summary>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">{summary.itemWarnings.map((w, i) => <li key={i}>{w.title}: {w.warnings.join(" ")}</li>)}</ul>
              </details>
            )}
          </section>
        )}

        {report && (
          <section role="status" className="space-y-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-[12px] text-emerald-900 dark:text-emerald-200">
            <h2 className="text-[13px] font-semibold">İçe aktarma tamamlandı</h2>
            <p>{report.created} yeni, {report.updated} güncellenen, {report.skippedExisting} atlanan içerik · {report.terms.created} yeni kategori/etiket · {report.redirects.created} yönlendirme ({report.redirects.skipped} atlandı)</p>
            {(report.images.downloaded > 0 || report.images.failed > 0) && <p>Görseller: {report.images.downloaded} indirildi, {report.images.failed} indirilemedi{report.images.skippedOverLimit ? `, ${report.images.skippedOverLimit} sınır nedeniyle atlandı` : ""}.</p>}
            {report.warnings.map((w, i) => <p key={i}>{w}</p>)}
            {report.failed.length > 0 && <ul className="list-disc pl-5 text-red-700">{report.failed.map((f, i) => <li key={i}>{f.title}: {f.error}</li>)}</ul>}
            <p>
              <Link href="/admin/posts" className="underline">Yazılar</Link> · <Link href="/admin/pages" className="underline">Sayfalar</Link> · <Link href="/admin/redirects" className="underline">Yönlendirmeler</Link>. Arama dizinini (RAG) içerik sayfalarından yeniden kurmayı unutmayın.
            </p>
          </section>
        )}
      </div>

      <aside className={`${card} h-fit space-y-3`}>
        <h2 className="text-[13px] font-semibold">Seçenekler</h2>
        <fieldset className="space-y-1.5"><legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">Türler</legend>
          {check("post", "Yazılar")}{check("page", "Sayfalar")}{check("product", "Ürünler (yalnızca metin)", "Fiyat, stok, varyasyon aktarılmaz.")}
        </fieldset>
        {check("includeDrafts", "Taslak ve bekleyenleri de al", "Özel (private) içerik gizli olarak alınır; çöp atlanır.")}
        {check("createRedirects", "Eski adreslerden 301 yönlendirmesi oluştur")}
        {check("downloadImages", "Görselleri indirip medya kitaplığına al", "En çok 400 görsel, 12 MB'a kadar; yalnızca genel internet adresleri. Kapalıysa görseller eski sitede kalır.")}
        {check("update", "Daha önce aktarılanları güncelle", "Kapalıysa aynı WordPress kimlikli içerik atlanır.")}
        <button type="button" onClick={() => void run()} disabled={!summary || summary.importing === 0 || busy !== ""} className="h-9 w-full rounded-md bg-[#266DF0] text-[12px] font-semibold text-white disabled:opacity-50">
          {busy === "run" ? "Aktarılıyor… (büyük dosyalarda dakikalar sürebilir)" : "İçe aktar"}
        </button>
        <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Aynı dosyayı tekrar yüklemek güvenlidir: içerikler WordPress kimliğiyle eşleşir.</p>
      </aside>

      <section className={`${card} lg:col-span-2 space-y-3 text-[12px]`}>
        <h2 className="text-[13px] font-semibold">Görünüm taslağı</h2>
        <p className="text-[#5F6570] dark:text-[#8C9099]">Yayımlanmış bir sayfanın rengini, menüsünü ve bloklarını okur. CSS ve JavaScript kopyalanmaz. Bu adım hiçbir kayıt yazmaz.</p>
        <div className="flex flex-wrap gap-2">
          <input value={shellUrl} onChange={(e) => setShellUrl(e.target.value)} className={`h-8 min-w-[16rem] flex-1 rounded-md border ${border} bg-transparent px-2`} placeholder="https://" />
          <button type="button" onClick={() => void readShell()} disabled={shellBusy || !shellUrl.trim()} className="h-8 rounded-md border border-[#E6E7EA] px-3 text-[12px] font-medium disabled:opacity-50 dark:border-[#23262E]">
            {shellBusy ? "Okunuyor…" : "Sayfayı oku"}
          </button>
        </div>
        {shellError && <p role="alert" className="text-red-600">{shellError}</p>}
        {shell && (
          <div className="space-y-2">
            <p><strong>{shell.title}</strong></p>
            <p className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm border" style={{ background: shell.primary }} /> {shell.primary}</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm border" style={{ background: shell.accent }} /> {shell.accent}</span>
              <span>{shell.blockCount} blok · menü {shell.menu.length} · alt şerit {shell.footerColumns}</span>
            </p>
            {shell.menu.length > 0 && <p>{shell.menu.join(" · ")}</p>}
            <p>{Object.entries(shell.blocks).map(([k, v]) => `${k} ${v}`).join(" · ")}</p>
            {shell.warnings.map((w, i) => <p key={i} className="text-amber-800 dark:text-amber-300">{w}</p>)}
          </div>
        )}
      </section>
    </div>
  );
}
