import { createTranslator } from "@nexpress/i18n";

/** Bakım ekranı. İstemci betiği yok; metin katalogdan veya yöneticinin cümlesinden gelir. */
export function MaintenanceView({ locale, message }: { locale: string; message: string }) {
  const t = createTranslator(locale);
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold">{t("maintenance.title")}</h1>
      <p className="mt-3 text-sm leading-relaxed">{message || t("maintenance.body")}</p>
    </main>
  );
}
