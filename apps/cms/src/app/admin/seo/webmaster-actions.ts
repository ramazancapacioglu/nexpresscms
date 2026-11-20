"use server";

import { headers } from "next/headers";
import type { GscPropertyEntry, UrlInspection, WebmasterSource } from "@nexpress/seo-core";
import { requireAdmin } from "@/lib/auth/session";
import { connectionStatus, inspect, listProperties, loadReport, testConnection, type ConnectionStatus, type ReportResult, type TestStep } from "@/lib/webmaster/connection";

const SOURCES: WebmasterSource[] = ["gsc", "ga4", "bing", "yandex"];
const isSource = (value: string): value is WebmasterSource => (SOURCES as string[]).includes(value);

/** Tek rapor bölümü. Yalnızca yönetici; bilgiler sunucuda okunur (istemciden gelmez), sonuç 10 dk önbelleklenir. */
export async function loadWebmasterReportAction(input: { source: string; section: string; days: number; fresh?: boolean }): Promise<ReportResult> {
  const admin = await requireAdmin("seo.webmaster.report");
  if (!isSource(input.source)) return { ok: false, kind: "bad_request", error: "Bilinmeyen kaynak." };
  return loadReport(admin.siteId, input.source, String(input.section), Number(input.days), Boolean(input.fresh));
}

export async function webmasterStatusAction(): Promise<Record<WebmasterSource, ConnectionStatus>> {
  const admin = await requireAdmin("seo.webmaster.status");
  return connectionStatus(admin.siteId);
}

export async function testWebmasterConnectionAction(input: { source: string }): Promise<{ ok: boolean; steps: TestStep[]; hint?: string }> {
  const admin = await requireAdmin("seo.webmaster.test");
  if (!isSource(input.source)) return { ok: false, steps: [{ label: "Kaynak", ok: false, detail: "Bilinmeyen kaynak." }] };
  return testConnection(admin.siteId, input.source);
}

export async function listGscPropertiesAction(): Promise<{ ok: true; properties: GscPropertyEntry[] } | { ok: false; error: string; hint?: string }> {
  const admin = await requireAdmin("seo.webmaster.properties");
  return listProperties(admin.siteId);
}

export async function inspectUrlAction(input: { url: string }): Promise<{ ok: true; result: UrlInspection } | { ok: false; error: string; hint?: string }> {
  const admin = await requireAdmin("seo.webmaster.inspect");
  const url = String(input.url ?? "").trim().slice(0, 500);
  // Site adresine göreli yol da kabul edilir
  if (url.startsWith("/")) {
    const origin = (process.env.NEXT_PUBLIC_APP_URL ?? (await headers()).get("host") ?? "").replace(/\/$/, "");
    return inspect(admin.siteId, `${origin.startsWith("http") ? origin : `https://${origin}`}${url}`);
  }
  return inspect(admin.siteId, url);
}
