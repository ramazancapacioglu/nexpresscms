import React from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { getAuditRepository, getFormDefinitionRepository, getScopedRepository } from "@nexpress/database";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

/** Başlangıç kontrol listesi (yöneticiye): gerçek durumdan hesaplanır, hepsi tamamlanınca görünmez. */
export async function SetupChecklist({ siteId }: { siteId: string }) {
  const repo = getScopedRepository(siteId);
  const [site, forms, backup, contents] = await Promise.all([
    repo.getSite(),
    getFormDefinitionRepository(siteId).list(),
    getAuditRepository(siteId).count({ actionPrefix: "backup.export" }),
    repo.listContents({ locale: "tr", status: "published" }),
  ]);
  const email = site?.settings.email;
  const items: Array<{ done: boolean; title: string; hint: string; href: string }> = [
    { done: Boolean(process.env.OPENAI_API_KEY?.trim()), title: "AI anahtarını bağla", hint: "AI yazım ve AI tasarım için OPENAI_API_KEY (anahtarsız da komut kopyalama yolu var).", href: "/admin/integrations" },
    { done: Boolean((email?.enabled && email.host) || process.env.SMTP_URL), title: "E-posta (SMTP) ayarla", hint: "Form bildirimleri ve otomatik yanıtlar için.", href: "/admin/forms/email" },
    { done: forms.length > 0, title: "İlk formu oluştur", hint: "Şablondan iletişim veya teklif formu kurun.", href: "/admin/forms/new" },
    { done: contents.length >= 3, title: "En az 3 sayfa yayınla", hint: "AI ile tasarlayıp taslak sayfa oluşturabilirsiniz.", href: "/admin/design-library" },
    { done: backup > 0, title: "İlk yedeği al", hint: "İçerik, medya ve ayarlar tek dosyada.", href: "/admin/backup" },
  ];
  const left = items.filter((i) => !i.done);
  if (left.length === 0) return null;
  return (
    <section aria-labelledby="setup-title" className={`rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="setup-title" className="text-[13px] font-semibold">Başlangıç kontrol listesi</h2>
        <span className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{items.length - left.length}/{items.length} tamam</span>
      </div>
      <ul className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((i) => (
          <li key={i.title}>
            <Link href={i.href} className={`flex h-full items-start gap-2 rounded-md border ${border} px-3 py-2 text-[12px] hover:border-[#266DF0] ${i.done ? "bg-[#F9FAFB] dark:bg-[#121317]" : ""}`}>
              {i.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-label="Tamam" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#5F6570] dark:text-[#8C9099]" aria-label="Yapılacak" />}
              <span><span className={`block font-medium ${i.done ? "line-through opacity-70" : ""}`}>{i.title}</span><span className="block text-[#5F6570] dark:text-[#9CA3AF]">{i.hint}</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
