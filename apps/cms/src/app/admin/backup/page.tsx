import React from "react";
import { requireAdminPage } from "@/lib/auth/session";
import { BackupPanel } from "./backup-panel";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

export default async function AdminBackupPage() {
  await requireAdminPage();
  return (
    <div className="space-y-5">
      <div className={`border-b ${border} pb-3.5`}>
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Yedekleme</h1>
        <p className="text-[12px] text-[#8C9099]">
          Bu sitenin içeriği, çevirileri, taksonomisi, menüleri, medya kayıtları, yönlendirmeleri, yüklenen temaları, eklenti ayarları ve site ayarları tek dosyada. <strong>Kullanıcılar, parolalar, oturumlar, denetim günlüğü, arama dizini, revizyonlar ve ticaret verisi yedeğe girmez</strong> (arama dizini içe aktarmadan sonra yeniden kurulur).
        </p>
      </div>
      <BackupPanel />
    </div>
  );
}
