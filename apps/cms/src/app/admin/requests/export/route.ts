import { getAgentRequestRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";

const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;

/** Talep listesinin CSV çıktısı. Yalnızca yönetici. */
export async function GET() {
  const me = await requireAdminPage();
  const rows = await getAgentRequestRepository(me.siteId).list({ limit: 2000 });
  const lines = [["id", "kind", "status", "name", "email", "phone", "company", "message", "createdAt"].join(",")];
  for (const row of rows) {
    lines.push([row.id, row.kind, row.status, row.name, row.email, row.phone, row.company, row.message, row.createdAt.toISOString()].map(cell).join(","));
  }
  return new Response(`\uFEFF${lines.join("\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=talepler.csv",
    },
  });
}
