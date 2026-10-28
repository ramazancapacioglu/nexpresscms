"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const card = `rounded-lg border ${border} bg-white dark:bg-[#15171C] p-4 space-y-3`;
const btn = `h-8 rounded-md border ${border} px-3 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] disabled:opacity-50`;

interface Summary {
  createdAt: string;
  sourceSite: string;
  tables: Record<string, number>;
  media: { files: number; bytes: number; skipped: number };
  personal: boolean;
  hasSite: boolean;
}
type Resp = { ok: true; dryRun?: boolean; summary?: Summary; warnings?: string[]; report?: { tables: Record<string, { inserted: number; skipped: number; conflicts: number }>; siteRestored: boolean }; media?: { written: number; existing: number }; note?: string } | { ok: false; errors: string[] };

export function BackupPanel() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState(true);
  const [personal, setPersonal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Resp | null>(null);
  const [result, setResult] = useState<Resp | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const post = async (extra: Record<string, string>) => {
    const body = new FormData();
    body.set("file", file!);
    for (const [k, v] of Object.entries(extra)) body.set(k, v);
    const res = await fetch("/api/admin/backup/import", { method: "POST", body });
    return (await res.json()) as Resp;
  };

  const verify = async (f: File) => {
    setFile(f);
    setPreview(null);
    setResult(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", f);
      body.set("dryRun", "1");
      const res = await fetch("/api/admin/backup/import", { method: "POST", body });
      setPreview((await res.json()) as Resp);
    } catch {
      setPreview({ ok: false, errors: ["Doğrulama tamamlanamadı."] });
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    setBusy(true);
    try {
      const r = await post({ mode, confirm });
      setResult(r);
      if (r.ok) router.refresh();
    } catch {
      setResult({ ok: false, errors: ["İçe aktarma tamamlanamadı."] });
    } finally {
      setBusy(false);
    }
  };

  const total = (t: Record<string, number>) => Object.values(t).reduce((a, b) => a + b, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={card}>
        <h2 className="text-[13px] font-semibold">Yedek al</h2>
        <label className="flex items-start gap-2 text-[12px]"><input type="checkbox" checked={media} onChange={(e) => setMedia(e.target.checked)} className="mt-0.5" /><span><strong>Görselleri ekle</strong> (özgün dosyalar, en çok 64 MB; fazlası atlanır)</span></label>
        <label className="flex items-start gap-2 text-[12px]"><input type="checkbox" checked={personal} onChange={(e) => setPersonal(e.target.checked)} className="mt-0.5" /><span><strong>Kişisel verileri ekle</strong> (form gönderimleri, yorumlar). Dosyayı güvenli saklayın.</span></label>
        <a href={`/api/admin/backup/export?media=${media ? 1 : 0}&personal=${personal ? 1 : 0}`} className={`${btn} inline-flex items-center gap-1.5`}>
          <Download className="h-3.5 w-3.5" /> Yedeği indir (.nxbackup)
        </a>
        <p className="text-[11px] text-[#8C9099]">Düzenli yedek için bu bağlantıyı bir zamanlayıcıdan çağırmak yerine veritabanı yedeğini de alın; bu dosya içerik taşıma ve geri dönüş içindir.</p>
      </section>

      <section className={card}>
        <h2 className="text-[13px] font-semibold">Yedekten geri yükle</h2>
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={`${btn} inline-flex items-center gap-1.5`}>
          <Upload className="h-3.5 w-3.5" /> {file ? file.name : "Yedek dosyası seç"}
        </button>
        <input ref={input} type="file" accept=".nxbackup,.zip,application/zip" hidden onChange={(e) => e.target.files?.[0] && void verify(e.target.files[0])} />
        {busy && !preview && <p className="text-[12px] text-[#8C9099]">Doğrulanıyor…</p>}

        {preview && !preview.ok && (
          <ul role="alert" className="list-disc space-y-0.5 pl-5 text-[12px] text-red-600">{preview.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        )}
        {preview?.ok && preview.summary && (
          <div className="space-y-3 text-[12px]">
            <div className="rounded-md bg-[#F4F5F7] dark:bg-[#1C1E24] p-3 space-y-1">
              <p><strong>{total(preview.summary.tables)}</strong> satır · {preview.summary.media.files} görsel{preview.summary.personal ? " · kişisel veri dahil" : ""}</p>
              <p className="text-[11px] text-[#8C9099]">{new Date(preview.summary.createdAt).toLocaleString("tr-TR")} · kaynak: {preview.summary.sourceSite}</p>
              <p className="text-[11px] text-[#8C9099]">{Object.entries(preview.summary.tables).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
            </div>
            {preview.warnings && preview.warnings.length > 0 && <ul className="list-disc space-y-0.5 pl-5 text-amber-700 dark:text-amber-300">{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
            <fieldset className="space-y-1.5">
              <legend className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9099]">Nasıl aktarılsın?</legend>
              <label className="flex items-start gap-2"><input type="radio" checked={mode === "merge"} onChange={() => setMode("merge")} className="mt-0.5" /><span><strong>Birleştir</strong> — yalnızca eksik içerikleri ekler; mevcutlara dokunmaz.</span></label>
              <label className="flex items-start gap-2"><input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} className="mt-0.5" /><span><strong>Değiştir</strong> — bu sitenin yedekteki tablolarını silip yedekten yazar ve site ayarlarını geri yükler. <span className="text-red-600">Geri alınamaz.</span></span></label>
            </fieldset>
            {mode === "replace" && (
              <label className="block text-[11px] text-[#8C9099]">Onay için <code>GERI YUKLE</code> yazın
                <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`mt-1 h-8 w-full rounded-md border ${border} bg-transparent px-2 text-[12px] font-mono outline-none focus:border-red-500`} />
              </label>
            )}
            <button type="button" disabled={busy || (mode === "replace" && confirm !== "GERI YUKLE")} onClick={() => void run()} className="h-8 rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white disabled:opacity-50">
              {busy ? "Aktarılıyor…" : mode === "replace" ? "Değiştirerek geri yükle" : "Birleştirerek aktar"}
            </button>
          </div>
        )}

        {result && !result.ok && <ul role="alert" className="list-disc space-y-0.5 pl-5 text-[12px] text-red-600">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
        {result?.ok && result.report && (
          <div role="status" className="space-y-1 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-[12px] text-emerald-800 dark:text-emerald-300">
            <p className="font-medium">İçe aktarma tamamlandı.</p>
            <p>{Object.entries(result.report.tables).map(([k, v]) => `${k}: +${v.inserted}${v.skipped ? ` (${v.skipped} atlandı)` : ""}${v.conflicts ? ` (${v.conflicts} çakışma)` : ""}`).join(" · ")}</p>
            {result.media && <p>{result.media.written} görsel yazıldı{result.media.existing ? `, ${result.media.existing} zaten vardı` : ""}.</p>}
            {result.note && <p>{result.note}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
