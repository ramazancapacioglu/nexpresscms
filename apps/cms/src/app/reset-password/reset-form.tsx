"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ResetState } from "./actions";

const field = "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950";

export function ResetForm({ token, minLength }: { token: string; minLength: number }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <label className="block space-y-1 text-xs font-medium">
        Yeni parola
        <input name="password" type="password" autoComplete="new-password" required minLength={minLength} className={field} />
      </label>
      <label className="block space-y-1 text-xs font-medium">
        Yeni parola (tekrar)
        <input name="confirm" type="password" autoComplete="new-password" required minLength={minLength} className={field} />
      </label>
      <p className="text-xs text-zinc-500">En az {minLength} karakter; e-postanızı ve yaygın parolaları içermemeli.</p>
      {state.error ? <p role="alert" className="text-xs text-red-600">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="h-9 w-full rounded-md bg-zinc-900 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Kaydediliyor…" : "Parolayı belirle ve giriş yap"}
      </button>
    </form>
  );
}
