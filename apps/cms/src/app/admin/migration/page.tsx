import React from "react";
import { requireAdminPage } from "@/lib/auth/session";
import { WpImportPanel } from "./wp-import-panel";

export const dynamic = "force-dynamic";

export default async function AdminWpMigrationPage() {
  await requireAdminPage();
  return (
    <div className="space-y-5">
      <div className="border-b border-[#E6E7EA] pb-3.5 dark:border-[#23262E]">
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">WordPress içe aktarma</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          WordPress'te <strong>Araçlar → Dışa Aktar → Tüm içerik</strong> ile aldığınız <code>.xml</code> dosyasını yükleyin. Yazılar, sayfalar ve ürün metinleri; kategoriler, etiketler, Yoast/Rank Math SEO alanları, öne çıkan görseller ve eski adres yönlendirmeleri aktarılır. Önce çözümleme yapılır, onayınızdan sonra yazılır.
        </p>
      </div>
      <WpImportPanel />
    </div>
  );
}
