import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getUserRepository } from "@nexpress/database";
import { TwoFactorCard } from "@/components/admin/users/two-factor-card";
import { ProfileForms } from "@/components/admin/users/profile-forms";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const me = await getSession();
  if (!me) redirect("/login");
  const user = await getUserRepository(me.siteId).findById(me.sub);
  return (
    <div className="space-y-4">
      <ProfileForms name={me.name} email={me.email} role={me.role} uiLocale={me.uiLocale} />
      <TwoFactorCard enabled={Boolean(user?.totpEnabledAt)} />
    </div>
  );
}
