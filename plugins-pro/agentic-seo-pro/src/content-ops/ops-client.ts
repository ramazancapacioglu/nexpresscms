/** Panel eklenti eylemi. Oturum çerezi gerekir; örnek veri sunucuda reddedilir. */
export async function runOps(name: string, payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string; data?: Record<string, unknown> }> {
  const res = await fetch("/admin/content-ops/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, payload }),
  });
  const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; data?: Record<string, unknown> } | null;
  if (!body || body.ok !== true) return { ok: false, error: body?.error || "İşlem tamamlanamadı." };
  return { ok: true, data: body.data };
}
