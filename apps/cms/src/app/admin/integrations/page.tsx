import React from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import { evaluateEnv, isPluginModuleEnabled } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import "@/plugins/register";
import { requireAdminPage } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
type State = "ok" | "missing" | "off";
interface Row { name: string; state: State; detail: string; how: string; href?: string }

const has = (k: string) => Boolean(process.env[k]?.trim());

/** Yalnızca VARLIK gösterilir: hiçbir sır, anahtar parçası veya bağlantı dizesi panele yazılmaz. */
export default async function IntegrationsPage() {
  const me = await requireAdminPage();
  const site = await getScopedRepository(me.siteId).getSite();
  const email = site?.settings.email;
  const [designOn, writerOn, mcpOn] = await Promise.all([
    isPluginModuleEnabled(me.siteId, "@nexpress-pro/ai-design", "generator"),
    isPluginModuleEnabled(me.siteId, "@nexpress-pro/agentic-seo", "ai-writer"),
    isPluginModuleEnabled(me.siteId, "@nexpress-pro/agentic-seo", "mcp"),
  ]);
  const smtp = (email?.enabled && email.host) || has("SMTP_URL");
  const env = evaluateEnv(process.env, process.env.NODE_ENV === "production");
  const secret = env.find((c) => c.id === "auth-secret");

  const groups: Array<{ title: string; rows: Row[] }> = [
    {
      title: "Yapay zeka",
      rows: [
        { name: "OpenAI anahtarı", state: has("OPENAI_API_KEY") ? "ok" : "missing", detail: has("OPENAI_API_KEY") ? "Tanımlı: AI yazım asistanı ve AI tasarım çalışır." : "Tanımlı değil: AI yazım ve AI tasarım kapalı; arama dizini yerel vektöre düşer.", how: "apps/cms/.env → OPENAI_API_KEY (isteğe bağlı OPENAI_BASE_URL, AI_WRITER_MODEL, AI_DESIGN_MODEL)" },
        { name: "AI Tasarım Pro", state: designOn ? "ok" : "off", detail: designOn ? "Etkin: tasarım kütüphanesinde AI ile üretim açık." : "Kapalı veya kurulu değil.", how: "Eklentiler sayfasından açılır", href: "/admin/plugins" },
        { name: "AI yazım asistanı", state: writerOn ? "ok" : "off", detail: writerOn ? "Etkin: editör SEO sekmesinde öneri üretir." : "Kapalı.", how: "Agentic SEO Pro → ai-writer modülü", href: "/admin/plugins" },
        { name: "Arama dizini (gömme)", state: has("EMBEDDING_PROVIDER") || has("OPENAI_API_KEY") ? "ok" : "off", detail: has("EMBEDDING_PROVIDER") ? "Sağlayıcı seçilmiş." : has("OPENAI_API_KEY") ? "OpenAI gömmesi kullanılır." : "Yerel (sözcüksel) arama kullanılır.", how: "EMBEDDING_PROVIDER / EMBEDDING_MODEL", href: "/admin/system" },
      ],
    },
    {
      title: "İletişim ve bildirim",
      rows: [
        { name: "E-posta (SMTP)", state: smtp ? "ok" : "missing", detail: smtp ? "Form bildirimleri ve otomatik yanıtlar gönderilebilir." : "Yapılandırılmamış: form e-postaları gönderilmez (gönderimler yine kaydedilir).", how: "Form → E-posta ayarları, ya da SMTP_URL", href: "/admin/forms/email" },
      ],
    },
    {
      title: "Arama motorları ve ajanlar",
      rows: [
        { name: "IndexNow", state: has("INDEXNOW_API_KEY") ? "ok" : "off", detail: has("INDEXNOW_API_KEY") ? "Yayında Bing/Yandex'e bildirilir (yalnızca üretimde)." : "Anahtar yok: yayın bildirimi gönderilmez.", how: "INDEXNOW_API_KEY" },
        { name: "MCP sunucusu", state: mcpOn ? "ok" : "off", detail: mcpOn ? "Etkin: ajanlar /api/mcp üzerinden içerik arar." : "Kapalı.", how: "Agentic SEO Pro → mcp modülü", href: "/admin/plugins" },
        { name: "MCP yazma anahtarı", state: has("MCP_AGENT_KEY") ? "ok" : "off", detail: has("MCP_AGENT_KEY") ? "Ajan talepleri (teklif/destek) kabul edilir." : "Anahtar yok: ajan eylemleri kapalı.", how: "MCP_AGENT_KEY", href: "/admin/requests" },
      ],
    },
    {
      title: "Güvenlik ve ortam",
      rows: [
        { name: "Oturum sırrı (AUTH_SECRET)", state: secret?.level === "ok" ? "ok" : "missing", detail: secret?.detail ?? "Denetlenemedi.", how: "AUTH_SECRET ≥ 32 karakter, benzersiz" },
        { name: "Sır şifreleme anahtarı", state: has("SECRETS_KEY") ? "ok" : "off", detail: has("SECRETS_KEY") ? "Ayrı SECRETS_KEY kullanılır." : "AUTH_SECRET'tan türetilir (ayrı anahtar önerilir).", how: "SECRETS_KEY" },
        { name: "Site adresi", state: has("NEXT_PUBLIC_APP_URL") ? "ok" : "missing", detail: has("NEXT_PUBLIC_APP_URL") ? "Tanımlı (sitemap, canonical, beslemeler)." : "Tanımlı değil: adresler localhost'a düşer.", how: "NEXT_PUBLIC_APP_URL" },
      ],
    },
  ];
  const icon = { ok: <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden />, missing: <CircleAlert className="h-4 w-4 text-amber-800 dark:text-amber-300" aria-hidden />, off: <CircleDashed className="h-4 w-4 text-[#5F6570] dark:text-[#8C9099]" aria-hidden /> };
  const label = { ok: "Hazır", missing: "Eksik", off: "Kapalı" };

  return (
    <div className="space-y-5">
      <div className={`border-b ${border} pb-3.5`}>
        <h1 className="text-[18px] font-semibold tracking-tight">Entegrasyonlar</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Harici hizmetlerin ve anahtarların durumu. Değerler güvenlik gereği burada gösterilmez ve değiştirilmez; sunucu ortam dosyasından ayarlanır. Ayrıntılı sağlık denetimi için <Link href="/admin/system" className="underline">Sistem durumu</Link>.</p>
      </div>
      {groups.map((g) => (
        <section key={g.title} aria-labelledby={`g-${g.title}`}>
          <h2 id={`g-${g.title}`} className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">{g.title}</h2>
          <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
            {g.rows.map((r) => (
              <li key={r.name} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3 text-[12px]">
                <span className="mt-0.5">{icon[r.state]}</span>
                <div className="min-w-0 flex-1 basis-64">
                  <p className="text-[13px] font-medium">{r.name} <span className="ml-1 text-[11px] font-normal text-[#5F6570] dark:text-[#8C9099]">{label[r.state]}</span></p>
                  <p className="text-[#5F6570] dark:text-[#9CA3AF]">{r.detail}</p>
                </div>
                <p className="basis-64 text-[11px] text-[#5F6570] dark:text-[#8C9099]">{r.href ? <Link href={r.href} className="text-[#1D5ED8] underline dark:text-[#7AA7FF]">{r.how}</Link> : r.how}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
