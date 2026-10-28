"use client";

import { useState, useTransition } from "react";
import { saveEmailSettingsAction, sendTestEmailAction } from "../actions";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const input = `h-8 w-full rounded-md border ${border} bg-transparent px-2 text-[12px] outline-none focus:border-[#266DF0]`;

interface Initial { enabled: boolean; host: string; port: number; secure: boolean; user: string; fromName: string; fromEmail: string; hasPassword: boolean }

export function EmailSettingsForm({ initial, envFallback }: { initial: Initial; envFallback: boolean }) {
  const [v, setV] = useState(initial);
  const [password, setPassword] = useState("");
  const [testTo, setTestTo] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Initial>(k: K, val: Initial[K]) => setV((s) => ({ ...s, [k]: val }));

  const save = () =>
    start(async () => {
      const r = await saveEmailSettingsAction({ enabled: v.enabled, host: v.host, port: Number(v.port), secure: v.secure, user: v.user, password, fromName: v.fromName, fromEmail: v.fromEmail });
      setMsg(r.ok ? { ok: true, text: "Kaydedildi." } : { ok: false, text: r.error });
      if (r.ok && password) { setPassword(""); set("hasPassword", true); }
    });
  const test = () =>
    start(async () => {
      const r = await sendTestEmailAction({ to: testTo });
      setMsg(r.ok ? { ok: true, text: "Test e-postası gönderildi." } : { ok: false, text: r.error });
    });

  const field = (label: string, el: React.ReactNode) => <label className="block space-y-1"><span className="block text-[11px] font-medium text-[#5C5F66] dark:text-[#9CA3AF]">{label}</span>{el}</label>;
  return (
    <div className="max-w-xl space-y-3">
      {envFallback && !v.enabled && <p className="rounded-md bg-[#F4F5F7] px-3 py-2 text-[12px] dark:bg-[#1C1E24]">Sunucuda <code>SMTP_URL</code> tanımlı; bu ayar kapalıyken o kullanılır (gönderen adresi için aşağıdaki alan gerekir).</p>}
      <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={v.enabled} onChange={(e) => set("enabled", e.target.checked)} /> SMTP ile e-posta gönder</label>
      <div className="grid grid-cols-[1fr_96px] gap-2">
        {field("SMTP sunucusu", <input className={input} value={v.host} placeholder="smtp.ornek.com" onChange={(e) => set("host", e.target.value)} />)}
        {field("Bağlantı noktası", <input className={input} type="number" value={v.port} onChange={(e) => set("port", Number(e.target.value))} />)}
      </div>
      <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={v.secure} onChange={(e) => set("secure", e.target.checked)} /> Örtük TLS (465); kapalıyken STARTTLS (587)</label>
      <div className="grid grid-cols-2 gap-2">
        {field("Kullanıcı adı", <input className={input} value={v.user} autoComplete="off" onChange={(e) => set("user", e.target.value)} />)}
        {field(v.hasPassword ? "Parola (kayıtlı; değiştirmek için yazın)" : "Parola", <input className={input} type="password" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {field("Gönderen adı", <input className={input} value={v.fromName} onChange={(e) => set("fromName", e.target.value)} />)}
        {field("Gönderen e-postası", <input className={input} type="email" value={v.fromEmail} placeholder="bilgi@ornek.com" onChange={(e) => set("fromEmail", e.target.value)} />)}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="h-8 rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white disabled:opacity-50">Kaydet</button>
        {msg && <span role="status" className={`text-[12px] ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</span>}
      </div>
      <div className={`flex items-end gap-2 border-t ${border} pt-3`}>
        <div className="flex-1">{field("Test e-postası gönder (önce kaydedin)", <input className={input} type="email" value={testTo} placeholder="siz@ornek.com" onChange={(e) => setTestTo(e.target.value)} />)}</div>
        <button type="button" onClick={test} disabled={pending || !testTo} className={`h-8 rounded-md border ${border} px-3 text-[12px] font-medium disabled:opacity-50`}>Gönder</button>
      </div>
    </div>
  );
}
