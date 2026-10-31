import { NextResponse } from "next/server";
import { auditCsvRow, AUDIT_CSV_HEADER, toCsv } from "@nexpress/core";
import { getAuditRepository } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-api";

export const runtime = "nodejs";

const BATCH = 200;
const MAX_ROWS = 50_000;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Denetim günlüğünü CSV indirir (yönetici). Süzgeçler sayfadakiyle aynıdır: `actor`, `action`, `from`, `to` (YYYY-MM-DD). */
export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const q = new URL(request.url).searchParams;
  const from = q.get("from") ?? "";
  const to = q.get("to") ?? "";
  if ((from && !DAY_RE.test(from)) || (to && !DAY_RE.test(to))) return NextResponse.json({ error: "Tarih YYYY-AA-GG olmalı." }, { status: 400 });
  const filter = {
    actorEmail: q.get("actor")?.trim() || undefined,
    actionPrefix: q.get("action")?.trim() || undefined,
    since: from ? new Date(`${from}T00:00:00.000Z`) : undefined,
    until: to ? new Date(`${to}T23:59:59.999Z`) : undefined,
  };
  const repo = getAuditRepository(auth.session.siteId);
  const rows: string[][] = [AUDIT_CSV_HEADER];
  for (let offset = 0; rows.length - 1 < MAX_ROWS; offset += BATCH) {
    const batch = await repo.list({ ...filter, limit: BATCH, offset });
    rows.push(...batch.map(auditCsvRow));
    if (batch.length < BATCH) break;
  }
  const truncated = rows.length - 1 >= MAX_ROWS;
  await recordAudit({ id: auth.session.sub, email: auth.session.email }, "audit.export", {
    detail: `${rows.length - 1} kayıt${truncated ? " (üst sınırda kesildi)" : ""}`,
    siteId: auth.session.siteId,
  });
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="denetim-${auth.session.siteId}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
      ...(truncated ? { "X-Truncated": "1" } : {}),
    },
  });
}
