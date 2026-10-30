import React from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";


const border = "border-[#E6E7EA] dark:border-[#23262E]";
const kbd = "rounded border border-[#E6E7EA] bg-[#F4F5F7] px-1.5 py-0.5 font-mono text-[11px] dark:border-[#23262E] dark:bg-[#1C1E24]";

const SHORTCUTS: Array<[string, string]> = [
  ["Ctrl/⌘ + K", "Komut paleti: sayfalara git, içerik/form/medya ara"],
  ["Ctrl/⌘ + B", "Kenar çubuğunu gizle/göster"],
  ["Ctrl/⌘ + S", "Form kurucusunda ve düzenleyicide kaydet"],
  ["Esc", "Palet, bildirim paneli ve açılır menüleri kapat"],
  ["Tab", "Odak sırası; sayfa başında \"İçeriğe geç\" bağlantısı"],
  ["↑ ↓ Enter", "Komut paletinde seç ve aç"],
];

const TASKS: Array<[string, string, string]> = [
  ["İlk sayfanı üret", "AI ile tasarla sekmesinden bir sayfa tarif edin, doğrulanmış çıktıdan taslak sayfa oluşturun.", "/admin/design-library"],
  ["SEO sorunlarını bul", "Yayındaki içeriklerde eksik açıklama, yinelenen başlık, alt metin ve ince içerik taraması.", "/admin/seo/audit"],
  ["E-posta bildirimlerini aç", "SMTP bilgilerini girin; form gönderimlerinde yöneticiye ve ziyaretçiye e-posta gitsin.", "/admin/forms/email"],
  ["Yedek al", "İçerik, medya, form ve ayarlar tek dosyada; geri yüklemeden önce doğrulanır.", "/admin/backup"],
  ["Eski siteyi taşı", "WordPress dışa aktarma dosyasından yazı, sayfa, kategori ve yönlendirmeleri aktarın.", "/admin/migration"],
  ["Anahtarları denetle", "OpenAI, SMTP, IndexNow ve MCP durumu tek ekranda.", "/admin/integrations"],
];

const TROUBLE: Array<[string, string]> = [
  ["Sayfa 500 veriyor, \"column … does not exist\"", "Veritabanı göçleri uygulanmamış: depoda `pnpm db:migrate` çalıştırın. Sistem durumu bekleyen göçleri de uyarır."],
  ["AI üretim \"OPENAI_API_KEY tanımlı değil\" diyor", "Anahtarı apps/cms/.env dosyasına ekleyip sunucuyu yeniden başlatın. Anahtarsız yol: \"Komutu kopyala\" ile dış sohbetten üretin, JSON'u yapıştırın."],
  ["Form e-postası gelmiyor", "Entegrasyonlar'da SMTP durumuna bakın; Gelen kutusunda gönderimin \"e-posta gönderilemedi\" notu hata nedenini gösterir."],
  ["Yayınladım ama sayfa eski görünüyor", "Ziyaretçi sayfaları önbelleklenir; panelden kaydedince düşer. CDN kullanıyorsanız PUBLIC_CACHE_SECONDS süresi kadar bayat kalabilir."],
];

export default async function HelpPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div className={`border-b ${border} pb-3.5`}>
        <h1 className="text-[18px] font-semibold tracking-tight">Yardım</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Hızlı başlangıç, klavye kısayolları ve sık karşılaşılan sorunlar.</p>
      </div>
      <section aria-labelledby="h-tasks">
        <h2 id="h-tasks" className="mb-2 text-[13px] font-semibold">Hızlı başlangıç</h2>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {TASKS.map(([t, d, href]) => (
            <li key={t}><Link href={href} className={`block h-full rounded-lg border ${border} bg-white p-4 hover:border-[#266DF0] dark:bg-[#15171C]`}><p className="text-[13px] font-medium">{t}</p><p className="mt-1 text-[12px] text-[#5F6570] dark:text-[#9CA3AF]">{d}</p></Link></li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="h-keys">
        <h2 id="h-keys" className="mb-2 text-[13px] font-semibold">Klavye</h2>
        <dl className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
          {SHORTCUTS.map(([k, d]) => <div key={k} className="flex items-center gap-4 px-4 py-2.5 text-[12px]"><dt className="w-36 shrink-0"><kbd className={kbd}>{k}</kbd></dt><dd className="text-[#5F6570] dark:text-[#9CA3AF]">{d}</dd></div>)}
        </dl>
      </section>
      <section aria-labelledby="h-trouble">
        <h2 id="h-trouble" className="mb-2 text-[13px] font-semibold">Sorun giderme</h2>
        <ul className="space-y-2">
          {TROUBLE.map(([q, a]) => <li key={q} className={`rounded-lg border ${border} bg-white p-3 text-[12px] dark:bg-[#15171C]`}><p className="font-medium">{q}</p><p className="mt-0.5 text-[#5F6570] dark:text-[#9CA3AF]">{a}</p></li>)}
        </ul>
      </section>
    </div>
  );
}
