"use client";

import Link from "next/link";
import { isTemplateKind, TEMPLATE_KINDS, validateTemplate } from "@nexpress/core";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useStudioInspector } from "./studio-inspector-context";

/** Şablon düzenleme modunun denetçi sekmesi: tür, çalışması için gerekenler (canlı doğrulama) ve yuva rehberi. */
export function TemplateTab() {
  const { templateKind, blocks } = useStudioInspector();
  if (!templateKind || !isTemplateKind(templateKind)) return <p className="text-[12px] text-muted-foreground">Şablon bilgisi okunamadı.</p>;
  const info = TEMPLATE_KINDS[templateKind];
  const issues = validateTemplate(templateKind, blocks);
  return (
    <div className="space-y-3 text-[12px]">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Şablon türü</div>
        <div className="text-[14px] font-semibold">{info.label}</div>
        <p className="text-muted-foreground">{info.description}</p>
      </div>
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Denetim</div>
        {issues.length === 0 ? (
          <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Şablon çalışmaya hazır.</p>
        ) : (
          <ul className="space-y-1">{issues.map((i) => <li key={i.message} className={`flex gap-1.5 rounded p-2 ${i.level === "error" ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-300"}`}><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>{i.message}</span></li>)}</ul>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Yuvalar</div>
        <p className="flex gap-1.5 text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>Kütüphane → <b>Şablon yuvaları</b> sekmesinden ekleyin. Yuvalar yayında gerçek veriyle dolar; burada örnek içerik görünür. Önerilen: {info.slots.join(", ")}.</span></p>
      </div>
      <p className="text-muted-foreground">Kaydedilen şablon her zaman taslaktır. Ziyaretçiye uygulanması için <Link href="/admin/appearance/templates" className="underline">Şablonlar</Link> sayfasında <b>Varsayılan yap</b> deyin ya da sayfa/yazı/kategori düzenlerken seçin.</p>
    </div>
  );
}
