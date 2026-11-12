import React from "react";
import { headers } from "next/headers";
import { getMemberRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { getMembership, mailerReady } from "@/lib/members";
import { MembersPanel, type MemberView } from "./members-panel";

export const dynamic = "force-dynamic";

/** Ziyaretçi üyeleri (yalnızca yönetici): kayıt politikası, davet, durum ve silme. Üyeler panel kullanıcısı değildir. */
export default async function AdminMembersPage() {
  const me = await requireAdminPage();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? me.siteId;
  const [members, settings, mail] = await Promise.all([getMemberRepository(siteId).list(), getMembership(siteId), mailerReady(siteId)]);
  const views: MemberView[] = members.map((m) => ({
    id: m.id,
    email: m.email,
    name: m.name,
    status: m.status,
    tier: m.tier,
    verified: m.emailVerifiedAt !== null,
    createdAt: m.createdAt.toISOString().slice(0, 10),
    lastLoginAt: m.lastLoginAt ? m.lastLoginAt.toISOString().slice(0, 10) : null,
  }));
  return <MembersPanel members={views} settings={settings} mailReady={mail} />;
}
