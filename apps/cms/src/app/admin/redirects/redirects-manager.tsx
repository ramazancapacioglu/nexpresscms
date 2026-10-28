"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRedirectAction, saveRedirectAction, toggleRedirectAction } from "./actions";

interface Rule {
  id: string;
  fromPath: string;
  toPath: string;
  code: number;
  enabled: boolean;
  hits: number;
  note: string;
  lastHitAt: string | null;
}

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const input = `h-8 rounded-md border ${border} bg-transparent px-2 text-[12px] outline-none focus:border-[#266DF0]`;

export function RedirectsManager({ rules, prefillFrom }: { rules: Rule[]; prefillFrom: string }) {
  const router = useRouter();
  const [from, setFrom] = useState(prefillFrom);
  const [to, setTo] = useState("");
  const [code, setCode] = useState(301);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, onOk?: () => void) =>
    start(async () => {
      try {
        const res = await fn();
        setMsg(res.ok ? { tone: "ok", text: ok } : { tone: "err", text: res.error ?? "İşlem başarısız." });
        if (res.ok) {
          onOk?.();
          router.refresh();
        }
      } catch {
        setMsg({ tone: "err", text: "İşlem tamamlanamadı." });
      }
    });

  return (
    <div className="space-y-4">
      <form
        className={`grid gap-2 rounded-lg border ${border} bg-white dark:bg-[#15171C] p-3 md:grid-cols-[1fr_1fr_110px_1fr_auto]`}
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveRedirectAction({ fromPath: from, toPath: to, code, note }), "Yönlendirme kaydedildi.", () => {
            setFrom("");
            setTo("");
            setNote("");
          });
        }}
      >
        <label className="text-[11px] text-[#8C9099]">Eski adres
          <input className={`${input} mt-1 w-full font-mono`} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/eski-sayfa" required />
        </label>
        <label className="text-[11px] text-[#8C9099]">Yeni adres
          <input className={`${input} mt-1 w-full font-mono`} value={to} onChange={(e) => setTo(e.target.value)} placeholder="/tr/yeni-sayfa veya https://…" required />
        </label>
        <label className="text-[11px] text-[#8C9099]">Tür
          <select className={`${input} mt-1 w-full`} value={code} onChange={(e) => setCode(Number(e.target.value))}>
            <option value={301}>301 kalıcı</option>
            <option value={302}>302 geçici</option>
            <option value={308}>308 kalıcı*</option>
            <option value={307}>307 geçici*</option>
          </select>
        </label>
        <label className="text-[11px] text-[#8C9099]">Not
          <input className={`${input} mt-1 w-full`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </label>
        <button type="submit" disabled={pending} className="h-8 self-end rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white disabled:opacity-60">Ekle</button>
      </form>
      <p className="text-[11px] text-[#8C9099]">* 301/302 sunucuda 308/307 olarak uygulanır (arama motorları aynı kabul eder; yöntem korunur).</p>
      {msg && <p role={msg.tone === "err" ? "alert" : "status"} className={`text-[12px] ${msg.tone === "ok" ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"}`}>{msg.text}</p>}

      {rules.length === 0 ? (
        <p className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] px-6 py-10 text-center text-[12px] text-[#8C9099]`}>Henüz yönlendirme yok.</p>
      ) : (
        <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
          {rules.map((r) => (
            <li key={r.id} className={`flex flex-wrap items-center gap-3 px-4 py-2.5 text-[12px] ${r.enabled ? "" : "opacity-50"}`}>
              <span className="rounded bg-[#266DF0]/10 px-1.5 py-px font-mono text-[10px] font-semibold text-[#266DF0]">{r.code}</span>
              <span className="min-w-0 flex-1">
                <code className="break-all text-[12px]">{r.fromPath}</code> <span className="text-[#8C9099]">→</span> <code className="break-all text-[12px]">{r.toPath}</code>
                {r.note && <span className="ml-2 text-[11px] text-[#8C9099]">{r.note}</span>}
              </span>
              <span className="font-mono text-[11px] text-[#8C9099]" title={r.lastHitAt ? `Son: ${new Date(r.lastHitAt).toLocaleString("tr-TR")}` : "Henüz kullanılmadı"}>{r.hits} isabet</span>
              <button type="button" disabled={pending} onClick={() => run(() => toggleRedirectAction({ id: r.id, enabled: !r.enabled }), r.enabled ? "Kapatıldı." : "Açıldı.")} className={`h-7 rounded-md border ${border} px-2.5 text-[12px] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}>
                {r.enabled ? "Kapat" : "Aç"}
              </button>
              <button type="button" disabled={pending} onClick={() => window.confirm("Bu yönlendirme silinsin mi?") && run(() => deleteRedirectAction({ id: r.id }), "Silindi.")} className="h-7 rounded-md px-2 text-[12px] text-red-600 hover:bg-red-500/10">Sil</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
