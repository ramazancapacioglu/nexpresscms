"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";

type Report =
  | { ok: true; replaced: boolean; theme: { id: string; name: string; version: string }; warnings: string[]; pages: number; hasChrome: boolean; hasCss: boolean }
  | { ok: false; errors: string[]; warnings: string[] };

const border = "border-[#E6E7EA] dark:border-[#23262E]";

/** Sürükle-bırak yükleme + doğrulama raporu. Kurulum etkinleştirme değildir. */
export function UploadPanel() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const send = async (file: File) => {
    setBusy(true);
    setReport(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/themes/upload", { method: "POST", body });
      setReport((await res.json()) as Report);
      if (res.ok) router.refresh();
    } catch {
      setReport({ ok: false, errors: ["Yükleme tamamlanamadı (ağ hatası)."], warnings: [] });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <section className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void send(f);
        }}
        className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition ${drag ? "border-[#266DF0] bg-[#266DF0]/5" : border}`}
      >
        <Upload className="h-6 w-6 text-[#5F6570] dark:text-[#8C9099]" />
        <p className="text-[13px] font-medium text-[#14151A] dark:text-[#F3F4F6]">{busy ? "Doğrulanıyor…" : "Tema paketini (.nxtheme) buraya bırakın"}</p>
        <p className="max-w-[60ch] text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Paket kod çalıştırmaz: token, üst/alt şablon, başlangıç sayfaları ve kapsamlı CSS içerir. Yükleme temayı <strong>etkinleştirmez</strong>; önce önizleyebilirsiniz. En çok 8 MB.
        </p>
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="h-8 rounded-md border border-[#E6E7EA] dark:border-[#23262E] px-3 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] disabled:opacity-50">
          Dosya seç
        </button>
        <input ref={input} type="file" accept=".nxtheme,.zip,application/zip" hidden onChange={(e) => e.target.files?.[0] && void send(e.target.files[0])} />
      </div>

      {report && (
        <div role={report.ok ? "status" : "alert"} className={`rounded-lg border p-3 text-[12px] ${report.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
          {report.ok ? (
            <p className="font-medium text-emerald-800 dark:text-emerald-300">
              {report.theme.name} v{report.theme.version} {report.replaced ? "güncellendi" : "kuruldu"}
              <span className="font-normal"> · {report.pages} başlangıç sayfası · {report.hasChrome ? "üst/alt şablon var" : "şablon yok"} · {report.hasCss ? "CSS var" : "CSS yok"}</span>
            </p>
          ) : (
            <>
              <p className="font-medium text-red-700 dark:text-red-300">Paket kurulmadı. {report.errors.length} hata:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-red-700 dark:text-red-300">
                {report.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </>
          )}
          {report.warnings.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-amber-800 dark:text-amber-300">
              {report.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
