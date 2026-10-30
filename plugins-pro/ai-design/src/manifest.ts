import type { PluginManifest } from "@nexpress/core";

export const AI_DESIGN_PLUGIN_ID = "@nexpress-pro/ai-design";

/**
 * AI Tasarım Pro: tarif (prompt) ile bölüm, sayfa ve tema jetonu tasarımı. Çıktı CMS'in blok sözleşmesine,
 * SEO/GEO ve erişilebilirlik sınırlarına göre doğrulanır; yayınlamaz, tasarım kütüphanesine kullanıcı onayıyla kaydedilir.
 */
export const AI_DESIGN_MANIFEST: PluginManifest = {
  id: AI_DESIGN_PLUGIN_ID,
  name: "AI Tasarım Pro",
  version: "1.0.0",
  vendor: "NexPress",
  license: "pro",
  icon: "Wand2",
  description: "Prompt ile bölüm, sayfa ve tema tasarlar. CMS'in blok sözleşmesini, SEO/GEO kurallarını ve WCAG kontrast sınırlarını bilir; çıktıyı doğrular, tek turda kendini onarır ve tasarım kütüphanesine kaydeder.",
  hooks: [],
  slots: [],
  endpoints: [],
  settingsHref: "/admin/design-library",
  settings: [
    { key: "designModel", label: "Model", type: "text", module: "generator", group: "AI tasarım", placeholder: "gpt-4o", help: "Boşsa AI_DESIGN_MODEL, o da yoksa AI_WRITER_MODEL, o da yoksa gpt-4o-mini.", maxLength: 60 },
    { key: "designRules", label: "Ek tasarım kuralları", type: "textarea", module: "generator", group: "AI tasarım", help: "Örn. Her sayfada 'Randevu al' birincil eylem olsun; yazılarda 'siz' dili kullan.", maxLength: 1000 },
  ],
  modules: [
    { id: "generator", group: "Üretim", status: "ready", defaultEnabled: true, label: "Tasarım üretici", description: "Bölüm, sayfa ve tema jetonu üretir; doğrulama ve tek turluk otomatik onarım.", surfaces: ["/admin/design-library"] },
  ],
};
