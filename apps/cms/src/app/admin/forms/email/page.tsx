import React from "react";
import Link from "next/link";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { EmailSettingsForm } from "./email-form";

export const dynamic = "force-dynamic";

export default async function EmailSettingsPage() {
  const me = await requireAdminPage();
  const e = (await getScopedRepository(me.siteId).getSite())?.settings.email;
  return (
    <div className="space-y-5">
      <div className="border-b border-[#E6E7EA] pb-3.5 dark:border-[#23262E]">
        <Link href="/admin/forms" className="text-[11px] text-[#8C9099] hover:underline">← Formlar</Link>
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">E-posta (SMTP) ayarları</h1>
        <p className="text-[12px] text-[#8C9099]">Form bildirimleri ve otomatik yanıtlar bu sunucu üzerinden gider. Parola şifreli saklanır, panele geri gösterilmez ve yedeğe girmez. Alternatif olarak sunucu ortamında <code>SMTP_URL</code> tanımlanabilir.</p>
      </div>
      <EmailSettingsForm
        initial={{ enabled: e?.enabled ?? false, host: e?.host ?? "", port: e?.port ?? 587, secure: e?.secure ?? false, user: e?.user ?? "", fromName: e?.fromName ?? "", fromEmail: e?.fromEmail ?? "", hasPassword: !!e?.password }}
        envFallback={!!process.env.SMTP_URL}
      />
    </div>
  );
}
