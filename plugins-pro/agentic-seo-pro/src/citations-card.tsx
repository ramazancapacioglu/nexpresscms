import React from "react";
import { getAiReferralRepository, getScopedRepository } from "@nexpress/database";

export async function CitationsCard({ siteId }: { siteId: string }) {
  const repo = getScopedRepository(siteId);
  const contents = await repo.listContents({ locale: "tr" });
  const published = contents.filter((c) => c.status === "published");

  // Alıntılanma hazırlık puanı hesaplama:
  // 1. TL;DR oranı (%35)
  // 2. Şema zenginliği (%35)
  // 3. İçerik tazeliği (%30)
  const withTldr = published.filter((c) => c.tldr && c.tldr.trim().length >= 20).length;
  const withSchema = published.filter((c) => c.schemaType && c.schemaType !== "WebPage").length;
  const tldrScore = published.length > 0 ? (withTldr / published.length) * 50 : 0;
  const schemaScore = published.length > 0 ? (withSchema / published.length) * 50 : 0;
  const totalCitationScore = Math.min(100, Math.round(tldrScore + schemaScore));
  const referrals = await getAiReferralRepository(siteId).summary(30);

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-nx-fg">AI Arama & Ajan Alıntı İzleme (Citation Monitor)</h4>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              GEO & LLM Hazırlığı
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            Puan, yayındaki içeriklerde TL;DR ve şema oranıdır. Motor alıntısı kaydı tutulmuyor.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5">
          <span className="text-xs text-nx-soft">Hazırlık:</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">%{totalCitationScore}</span>
        </div>
      </div>

      {referrals.total === 0 ? (
        <p className="rounded-lg border border-nx-line bg-nx-subtle px-3 py-2 text-xs text-nx-soft">
          Kayıtlı yönlendirme yok. Motor alıntısı uydurulmaz; hazırlık puanı içerik oranıdır.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {referrals.bySource.slice(0, 6).map((row) => (
            <li key={row.source} className="flex items-center justify-between rounded-lg border border-nx-line bg-nx-subtle px-3 py-2 text-xs">
              <span className="text-nx-fg">{row.source}</span>
              <span className="text-nx-soft">{row.hits}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

