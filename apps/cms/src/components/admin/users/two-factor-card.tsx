"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import {
  beginTwoFactorSetupAction,
  confirmTwoFactorSetupAction,
  disableTwoFactorAction,
  regenerateRecoveryCodesAction,
} from "@/app/admin/profile/two-factor-actions";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = `h-8 w-full rounded border ${border} bg-transparent px-2 text-[12px] outline-none focus:ring-1 focus:ring-[#266DF0]`;
const btn = "h-8 rounded bg-[#266DF0] px-3 text-[12px] font-medium text-white disabled:opacity-60";
const btnGhost = `h-8 rounded border ${border} px-3 text-[12px] disabled:opacity-60`;

type Mode = "idle" | "setup" | "disable" | "codes";

export function TwoFactorCard({ enabled: initial }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [mode, setMode] = useState<Mode>("idle");
  const [pending, start] = useTransition();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const reset = (next: Mode = "idle") => {
    setMode(next);
    setPassword("");
    setCode("");
    setSetup(null);
  };
  const fail = (text: string) => setMessage({ kind: "error", text });

  return (
    <section className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] p-4 space-y-3`} aria-labelledby="twofa-title">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" />
        <h2 id="twofa-title" className="text-[13px] font-semibold">İki adımlı doğrulama</h2>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${enabled ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"}`}>{enabled ? "Açık" : "Kapalı"}</span>
      </div>
      <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
        Girişte parolaya ek olarak doğrulayıcı uygulamadaki (Google Authenticator, 1Password, Authy vb.) 6 haneli kod istenir. Telefonunuzu kaybederseniz kurtarma kodları kullanılır.
      </p>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-[12px] ${message.kind === "error" ? "border-red-500/30 bg-red-500/10 text-red-700" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"}`}>{message.text}</p>
      )}

      {recovery && (
        <div className={`rounded-md border ${border} p-3 space-y-2`}>
          <div className="text-[12px] font-semibold">Kurtarma kodları — şimdi kaydedin, bir daha gösterilmez</div>
          <ul className="grid grid-cols-2 gap-1 font-mono text-[12px]">{recovery.map((c) => <li key={c}>{c}</li>)}</ul>
          <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Her kod yalnızca bir kez çalışır. Güvenli bir yerde (parola yöneticisi) saklayın.</p>
          <button type="button" className={btnGhost} onClick={() => setRecovery(null)}>Kaydettim</button>
        </div>
      )}

      {mode === "idle" && !recovery && (
        <div className="flex flex-wrap gap-2">
          {!enabled ? (
            <button type="button" className={btn} onClick={() => { setMessage(null); setMode("setup"); }}>Kur</button>
          ) : (
            <>
              <button type="button" className={btnGhost} onClick={() => { setMessage(null); setMode("codes"); }}>Kurtarma kodlarını yenile</button>
              <button type="button" className={btnGhost} onClick={() => { setMessage(null); setMode("disable"); }}>Kapat</button>
            </>
          )}
        </div>
      )}

      {mode === "setup" && !setup && (
        <form className="space-y-2 max-w-sm" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await beginTwoFactorSetupAction({ password }); if (r.ok) { setSetup({ secret: r.secret, uri: r.uri }); setPassword(""); setMessage(null); } else fail(r.error); }); }}>
          <label className="block space-y-1 text-[12px] font-medium">Mevcut parolanız<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} /></label>
          <div className="flex gap-2"><button type="submit" disabled={pending} className={btn}>Devam</button><button type="button" className={btnGhost} onClick={() => reset()}>Vazgeç</button></div>
        </form>
      )}

      {mode === "setup" && setup && (
        <form className="space-y-2 max-w-md" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await confirmTwoFactorSetupAction({ code }); if (r.ok) { setEnabled(true); setRecovery(r.recoveryCodes); reset(); setMessage({ kind: "ok", text: "İki adımlı doğrulama açıldı." }); } else fail(r.error); }); }}>
          <p className="text-[12px]">Doğrulayıcı uygulamanızda <b>anahtar girerek</b> yeni hesap ekleyin (zaman tabanlı) ve aşağıdaki kodu yazın:</p>
          <code aria-label="Kurulum anahtarı" className={`block select-all break-all rounded border ${border} px-2 py-1.5 font-mono text-[13px] tracking-wider`}>{setup.secret}</code>
          <a href={setup.uri} className="text-[11px] underline">Uygulamada aç (otpauth)</a>
          <label className="block space-y-1 text-[12px] font-medium">Uygulamadaki 6 haneli kod<input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} className={field} /></label>
          <div className="flex gap-2"><button type="submit" disabled={pending} className={btn}>Doğrula ve aç</button><button type="button" className={btnGhost} onClick={() => reset()}>Vazgeç</button></div>
        </form>
      )}

      {(mode === "disable" || mode === "codes") && (
        <form className="space-y-2 max-w-sm" onSubmit={(e) => { e.preventDefault(); start(async () => {
          if (mode === "disable") { const r = await disableTwoFactorAction({ password, code }); if (r.ok) { setEnabled(false); reset(); setMessage({ kind: "ok", text: "İki adımlı doğrulama kapatıldı; diğer oturumlar kapandı." }); } else fail(r.error); }
          else { const r = await regenerateRecoveryCodesAction({ password, code }); if (r.ok) { setRecovery(r.recoveryCodes); reset(); setMessage(null); } else fail(r.error); }
        }); }}>
          <label className="block space-y-1 text-[12px] font-medium">Mevcut parolanız<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} /></label>
          <label className="block space-y-1 text-[12px] font-medium">6 haneli kod veya kurtarma kodu<input autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} className={field} /></label>
          <div className="flex gap-2"><button type="submit" disabled={pending} className={btn}>{mode === "disable" ? "Kapat" : "Yeni kodlar üret"}</button><button type="button" className={btnGhost} onClick={() => reset()}>Vazgeç</button></div>
        </form>
      )}
    </section>
  );
}
