"use client";

import { useActionState } from "react";
import { requestResetAction, type ForgotState } from "./actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestResetAction, {});
  if (state.done) {
    return (
      <p role="status" className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
        Bu e-posta ile kayıtlı bir hesap varsa parola sıfırlama bağlantısı gönderildi. Bağlantı 1 saat geçerlidir.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <label className="block space-y-1 text-xs font-medium">
        E-posta
        <input name="email" type="email" autoComplete="username" required className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950" />
      </label>
      {state.error ? <p role="alert" className="text-xs text-red-600">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="h-9 w-full rounded-md bg-zinc-900 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900">
        {pending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
      </button>
    </form>
  );
}
