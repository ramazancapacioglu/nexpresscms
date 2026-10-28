import React from "react";
import { getUserRepository, toSummary } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { UsersBoard } from "@/components/admin/users/users-board";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await requireAdminPage();
  const users = (await getUserRepository(me.siteId).list()).map(toSummary);
  return <UsersBoard initial={users} meId={me.sub} />;
}
