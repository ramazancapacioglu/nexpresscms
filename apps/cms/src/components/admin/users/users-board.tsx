"use client";

import React, { useState, useTransition } from "react";
import type { UserSummaryDto } from "@nexpress/database";
import {
  createUserAction,
  resetUserPasswordAction,
  revokeUserSessionsAction,
  setUserRoleAction,
  setUserStatusAction,
  type UserActionResult,
} from "@/app/admin/users/actions";
import { PASSWORD_MIN_LENGTH, type UserRole } from "@nexpress/core";
import { UserPlus } from "lucide-react";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = `h-8 rounded border ${border} bg-transparent px-2 text-[12px] outline-none focus:ring-1 focus:ring-[#266DF0]`;
const ROLE_LABEL: Record<UserRole, string> = { admin: "Yönetici", editor: "Editör" };
const fmt = (d: Date | null) => (d ? new Date(d).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—");

export function UsersBoard({ initial, meId }: { initial: UserSummaryDto[]; meId: string }) {
  const [users, setUsers] = useState(initial);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [form, setForm] = useState({ email: "", name: "", role: "editor" as UserRole, password: "" });

  const run = (fn: () => Promise<UserActionResult>, ok: string, apply?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        apply?.();
        setMessage({ kind: "ok", text: ok });
      } else setMessage({ kind: "error", text: res.error });
    });

  const patch = (id: string, change: Partial<UserSummaryDto>) =>
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...change } : u)));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[16px] font-bold tracking-tight">Kullanıcılar & Roller</h1>
        <p className="text-[12px] text-[#8C9099]">
          Yönetici her şeyi yönetir; Editör içerik, medya, tema ve katalogla çalışır, ayarlara ve kullanıcılara erişemez.
          Rol, devre dışı bırakma ve parola sıfırlama kullanıcının açık oturumlarını hemen kapatır.
        </p>
      </div>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-[12px] ${message.kind === "error" ? "border-red-500/30 bg-red-500/10 text-red-700" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"}`}>
          {message.text}
        </p>
      )}

      <div className={`overflow-x-auto rounded-lg border ${border} bg-white dark:bg-[#15171C]`}>
        <table className="w-full text-[12px]">
          <thead className="bg-[#FBFBFB] dark:bg-[#121317] text-left text-[10px] uppercase tracking-wider text-[#8C9099]">
            <tr>
              <th className="px-3 py-2">Kullanıcı</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">Son giriş</th>
              <th className="px-3 py-2 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-[#E6E7EA] dark:divide-[#23262E]`}>
            {users.map((u) => {
              const self = u.id === meId;
              return (
                <React.Fragment key={u.id}>
                  <tr className={u.status === "disabled" ? "opacity-60" : ""}>
                    <td className="px-3 py-2">
                      <div className="font-medium">{u.name || u.email}{self && <span className="ml-1.5 text-[10px] text-[#266DF0]">(siz)</span>}</div>
                      <div className="font-mono text-[10px] text-[#8C9099]">{u.email}</div>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        aria-label={`${u.email} rolü`}
                        value={u.role}
                        disabled={pending || self}
                        onChange={(e) => {
                          const role = e.target.value as UserRole;
                          run(() => setUserRoleAction({ id: u.id, role }), "Rol güncellendi.", () => patch(u.id, { role }));
                        }}
                        className={field}
                      >
                        {(["admin", "editor"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${u.status === "active" ? "bg-emerald-500/10 text-emerald-700" : "bg-zinc-500/10 text-zinc-600"}`}>
                        {u.status === "active" ? "etkin" : "devre dışı"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#5C5F66] dark:text-[#9CA3AF]">{fmt(u.lastLoginAt)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {!self && (
                          <button type="button" disabled={pending} className={`h-7 rounded border ${border} px-2`}
                            onClick={() => {
                              const status = u.status === "active" ? "disabled" : "active";
                              run(() => setUserStatusAction({ id: u.id, status }), status === "disabled" ? "Hesap devre dışı bırakıldı." : "Hesap etkinleştirildi.", () => patch(u.id, { status }));
                            }}>
                            {u.status === "active" ? "Devre dışı bırak" : "Etkinleştir"}
                          </button>
                        )}
                        {!self && (
                          <button type="button" disabled={pending} className={`h-7 rounded border ${border} px-2`} onClick={() => { setResetFor(resetFor === u.id ? null : u.id); setResetPw(""); }}>
                            Parola sıfırla
                          </button>
                        )}
                        <button type="button" disabled={pending} className={`h-7 rounded border ${border} px-2`}
                          onClick={() => run(() => revokeUserSessionsAction({ id: u.id }), "Oturumlar kapatıldı.")}>
                          Oturumları kapat
                        </button>
                      </div>
                    </td>
                  </tr>
                  {resetFor === u.id && (
                    <tr>
                      <td colSpan={5} className="bg-[#FBFBFB] dark:bg-[#121317] px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <input type="password" autoComplete="new-password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} placeholder={`Yeni parola (en az ${PASSWORD_MIN_LENGTH} karakter)`} className={`${field} min-w-64`} />
                          <button type="button" disabled={pending || !resetPw} className="h-8 rounded bg-[#266DF0] px-3 font-medium text-white disabled:opacity-60"
                            onClick={() => run(() => resetUserPasswordAction({ id: u.id, password: resetPw }), "Parola sıfırlandı; kullanıcının oturumları kapandı.", () => { setResetFor(null); setResetPw(""); })}>
                            Sıfırla
                          </button>
                          <span className="text-[11px] text-[#8C9099]">Parolayı kullanıcıya güvenli bir kanaldan iletin; ilk girişte değiştirmesini isteyin.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <form
        className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] p-3 space-y-2`}
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await createUserAction(form);
            if (res.ok && res.user) {
              setUsers((list) => [...list, { ...res.user!, createdAt: new Date(res.user!.createdAt), lastLoginAt: null }]);
              setForm({ email: "", name: "", role: "editor", password: "" });
              setMessage({ kind: "ok", text: "Kullanıcı oluşturuldu." });
            } else if (!res.ok) setMessage({ kind: "error", text: res.error });
          });
        }}
      >
        <div className="flex items-center gap-1.5 text-[12px] font-semibold"><UserPlus className="h-3.5 w-3.5" /> Yeni kullanıcı</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input required type="email" aria-label="E-posta" placeholder="E-posta" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
          <input aria-label="Ad" placeholder="Ad Soyad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
          <select aria-label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className={field}>
            {(["editor", "admin"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <input required type="password" autoComplete="new-password" aria-label="İlk parola" placeholder={`İlk parola (${PASSWORD_MIN_LENGTH}+ karakter)`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={field} />
          <button type="submit" disabled={pending} className="h-8 rounded bg-[#266DF0] px-3 font-medium text-white disabled:opacity-60">Oluştur</button>
        </div>
      </form>
    </div>
  );
}
