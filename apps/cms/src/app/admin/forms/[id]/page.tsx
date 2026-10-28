import React from "react";
import { notFound } from "next/navigation";
import { getFormDefinitionRepository, getScopedRepository } from "@nexpress/database";
import { requireUser } from "@/lib/auth/session";
import { FormBuilder } from "./form-builder";

export const dynamic = "force-dynamic";

export default async function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const [form, site] = await Promise.all([getFormDefinitionRepository(me.siteId).get(id), getScopedRepository(me.siteId).getSite()]);
  if (!form) notFound();
  const email = site?.settings.email;
  const smtpReady = !!((email?.enabled && email.host) || process.env.SMTP_URL);
  return (
    <FormBuilder
      id={form.id}
      initial={{ name: form.name, status: form.status, spec: form.spec, notify: form.notify }}
      smtpReady={smtpReady}
      contactEmail={site?.settings.general.contactEmail ?? ""}
      isAdmin={me.role === "admin"}
    />
  );
}
