import React from "react";
import { requireAdminPage } from "@/lib/auth/session";
import { WP_BRIDGE_VERSION } from "@/plugins/wp-bridge";
import { BridgePanel } from "./bridge-panel";

export const dynamic = "force-dynamic";

export default async function AdminWpBridgePage() {
  await requireAdminPage();
  return (
    <div className="space-y-5">
      <div className="border-b border-[#E6E7EA] pb-3.5 dark:border-[#23262E]">
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">WordPress Köprüsü</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Sayfa, yazı, yorum, form, şema, medya ve yerleşim site eklentisinden gelir. E-ticaret aktarılmaz. Plan: docs/24. Dosya ile aktarım ayrı durur.
        </p>
      </div>
      <BridgePanel version={WP_BRIDGE_VERSION} />
      <ol className="list-decimal space-y-1 pl-5 text-[13px] text-[#5F6570] dark:text-[#8C9099]">
        <li>Site eklentisini indirip WordPress’e kurun.</li>
        <li>İsterseniz içeriği sıfırlayın. Şablon ve kütüphane kalır.</li>
        <li>Eşleştirme, yazma ve yerleşim çizimi sonraki sürümde açılır. İç bağlantılar aktarım sırasında taranır.</li>
      </ol>
    </div>
  );
}
