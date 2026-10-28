import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ProfileForms } from "@/components/admin/users/profile-forms";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const me = await getSession();
  if (!me) redirect("/login");
  return <ProfileForms name={me.name} email={me.email} role={me.role} />;
}
