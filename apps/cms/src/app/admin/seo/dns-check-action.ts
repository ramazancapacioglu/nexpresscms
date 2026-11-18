"use server";

import { promises as dns } from "node:dns";
import {
  BING_CNAME_TARGET,
  acceptVerifyCode,
  bingCnameLabelOk,
  cnameHit,
  googleTxtValue,
  txtHit,
  verificationHosts,
  yandexTxtValue,
} from "@nexpress/core";
import { requireAdmin } from "@/lib/auth/session";
import { getScopedRepository } from "@nexpress/database";

export type DnsCheckKind = "google" | "yandex" | "bing";

/**
 * Sitenin kendi alan adında TXT veya Bing CNAME kaydını arar.
 * DNS'e yazılmaz; yalnızca barındırıcıdaki kaydın görünüp görünmediği sorulur.
 */
export async function checkWebmasterDnsAction(input: {
  kind: DnsCheckKind;
  code: string;
}): Promise<{ ok: true; found: boolean; detail: string } | { ok: false; error: string }> {
  const admin = await requireAdmin("seo.dns.check");
  const repo = getScopedRepository(admin.siteId);
  const site = await repo.getSite();
  const hosts = verificationHosts(site?.domain);
  if (!hosts.length) {
    return { ok: false, error: "Site alan adı kayıtlı değil. Doğrulama sorgusu yalnızca bu alan adında yapılır." };
  }

  if (input.kind === "bing") {
    const label = input.code.trim().toLowerCase();
    if (!bingCnameLabelOk(label)) return { ok: false, error: "Bing CNAME adı geçersiz." };
    const names = hosts.map((host) => `${label}.${host}`);
    for (const name of names) {
      try {
        const rows = await dns.resolveCname(name);
        if (cnameHit(rows)) return { ok: true, found: true, detail: `${name} → ${BING_CNAME_TARGET}` };
      } catch {
        // Kayıt yoksa diğer adı dene.
      }
    }
    return {
      ok: true,
      found: false,
      detail: `${names[0]} kaydı görünmüyor. Hedef ${BING_CNAME_TARGET} olmalı. Yayılması birkaç saat sürebilir.`,
    };
  }

  const token = acceptVerifyCode(input.code);
  if (!token) return { ok: false, error: "DNS kodu tanınmadı." };
  const expected = input.kind === "google" ? googleTxtValue(token) : yandexTxtValue(token);
  for (const host of hosts) {
    try {
      const rows = await dns.resolveTxt(host);
      if (txtHit(rows, expected)) return { ok: true, found: true, detail: `${host} üzerinde kayıt var.` };
    } catch {
      // NXDOMAIN veya boş yanıt: diğer ada bak.
    }
  }
  return {
    ok: true,
    found: false,
    detail: `${hosts[0]} üzerinde "${expected}" görünmüyor. Kaydı kök ada (@) ekleyin.`,
  };
}
