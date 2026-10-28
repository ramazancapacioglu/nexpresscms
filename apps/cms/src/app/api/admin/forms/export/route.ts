import { NextResponse } from "next/server";
import { toCsv } from "@nexpress/core";
import { FORM_STATUSES, getFormSubmissionRepository, type FormStatus } from "@nexpress/database";
import { recordAudit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/theme-packages";

export const runtime = "nodejs";

/** Gönderimleri CSV indirir (yönetici). `?status=` ile süzülür. Formül enjeksiyonuna karşı hücreler güvenli yazılır. */
export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const s = new URL(request.url).searchParams.get("status") as FormStatus | null;
  const status = s && FORM_STATUSES.includes(s) ? s : undefined;
  const rows = await getFormSubmissionRepository(auth.session.siteId).list({ status, limit: 5000 });
  const names = [...new Set(rows.flatMap((r) => r.fields.map((f) => f.label)))];
  const csv = toCsv([
    ["Tarih", "Durum", "Sayfa", "Form", ...names],
    ...rows.map((r) => [r.createdAt.toISOString(), r.status, r.pagePath, r.formTitle, ...names.map((n) => r.fields.find((f) => f.label === n)?.value ?? "")]),
  ]);
  await recordAudit({ id: auth.session.sub, email: auth.session.email }, "forms.export", { detail: `${rows.length} satır${status ? ` (${status})` : ""}`, siteId: auth.session.siteId });
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="form-gonderimleri.csv"', "Cache-Control": "no-store" } });
}
