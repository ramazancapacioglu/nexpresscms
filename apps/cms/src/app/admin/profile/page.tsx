import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getUserRepository } from "@nexpress/database";
import { TwoFactorCard } from "@/components/admin/users/two-factor-card";
import { ProfileForms } from "@/components/admin/users/profile-forms";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage({ searchParams }: { searchParams: Promise<{ "2fa"?: string }> }) {
  const sp = await searchParams;
  const me = await getSession();
  if (!me) redirect("/login");
  const user = await getUserRepository(me.siteId).findById(me.sub);
  return (
    <div className="space-y-4">
      {sp["2fa"] === "required" && (
        <p role="alert" className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-900 dark:text-amber-200">
          Bu sitede yöneticiler için iki adımlı doğrulama zorunludur. Panele devam etmek için aşağıdan kurun.
        </p>
      )}
      <ProfileForms name={me.name} email={me.email} role={me.role} uiLocale={me.uiLocale} />
      <TwoFactorCard enabled={Boolean(user?.totpEnabledAt)} />
    </div>
  );
}
