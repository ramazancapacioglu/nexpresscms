import React from "react";
import { WpMigrationClient } from "@/components/admin/wp-migration-client";

export default function AdminWpMigrationPage() {
  return (
    <div className="space-y-4">
      <div className="border-b border-[#E6E7EA] dark:border-[#23262E] pb-3.5">
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">
          WordPress → NexPress Göç Aracı
        </h1>
        <p className="text-[12px] text-[#8C9099]">
          Klasik WordPress, Elementor ve WooCommerce içeriklerini hantal kısa kodlardan arındırıp 0-KB RSC bloklarına ve 301 yönlendirmelerine dönüştürün.
        </p>
      </div>

      <WpMigrationClient />
    </div>
  );
}
