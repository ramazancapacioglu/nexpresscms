"use client";

import { useActionState } from "react";
import { cancelSecondFactorAction, verifySecondFactorAction, type VerifyState } from "./actions";

export function VerifyForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(verifySecondFactorAction, {});
  return (
    <div className="space-y-3">
      <form action={action} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <label className="block space-y-1 text-xs font-medium">
          Doğrulama kodu
          <input name="code" inputMode="text" autoComplete="one-time-code" autoFocus required className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm tracking-widest outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950" />
        </label>
        <p className="text-xs text-zinc-500">Doğrulayıcı uygulamanızdaki 6 haneli kodu ya da bir kurtarma kodunu girin.</p>
        {state.error ? <p role="alert" className="text-xs text-red-600">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="h-9 w-full rounded-md bg-zinc-900 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900">
          {pending ? "Doğrulanıyor…" : "Doğrula ve gir"}
        </button>
      </form>
      <form action={cancelSecondFactorAction}>
        <button type="submit" className="text-xs underline">Vazgeç, girişe dön</button>
      </form>
    </div>
  );
}
