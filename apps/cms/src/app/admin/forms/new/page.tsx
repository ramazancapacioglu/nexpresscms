import React from "react";
import Link from "next/link";
import { FORM_TEMPLATES } from "@nexpress/core";
import { requireUser } from "@/lib/auth/session";
import { TemplateGallery } from "./template-gallery";

export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  await requireUser();
  return (
    <div className="space-y-5">
      <div className="border-b border-[#E6E7EA] pb-3.5 dark:border-[#23262E]">
        <Link href="/admin/forms" className="text-[11px] text-[#8C9099] hover:underline">← Formlar</Link>
        <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Yeni form</h1>
        <p className="text-[12px] text-[#8C9099]">Bir şablonla başlayın ya da boş formdan kurun. Şablon bir kopya olarak açılır; istediğiniz gibi değiştirebilirsiniz.</p>
      </div>
      <TemplateGallery
        templates={FORM_TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description, category: t.category, fields: t.spec.fields.filter((f) => f.type !== "heading" && f.type !== "paragraph").map((f) => f.label) }))}
      />
    </div>
  );
}
