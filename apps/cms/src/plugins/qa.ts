import type { PluginManifest } from "@nexpress/core";

/** Soru-cevap eklentisi. WordPress AI Prompt eklentisinin ziyaretçi yüzü: arşiv, soru formu, faydalı oyu, gelen kutusu. */
export const QA_PLUGIN_ID = "@nexpress/plugin-qa";

export const QA_PLUGIN_MANIFEST: PluginManifest = {
  id: QA_PLUGIN_ID,
  name: "Soru-Cevap",
  version: "1.0.0",
  vendor: "NexPress",
  license: "free",
  builtin: false,
  icon: "CircleHelp",
  description:
    "Soru sayfaları (/sorular), ziyaretçinin soru bırakması, faydalı oyu ve yönetim gelen kutusu. Ziyaretçi sayfasına betik eklemez.",
  settingsHref: "/admin/questions",
  endpoints: ["/{locale}/sorular", "/api/qa"],
  modules: [
    {
      id: "archive",
      group: "Vitrin",
      label: "Soru arşivi (/sorular)",
      description: "Yayındaki soru sayfalarının listesi.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/{locale}/sorular"],
    },
    {
      id: "ask",
      group: "Vitrin",
      label: "Ziyaretçi sorusu",
      description: "Soru sayfasının altındaki form. Cevap bekleyen kayıt gelen kutusuna düşer.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "vote",
      group: "Vitrin",
      label: "Faydalı oyu",
      description: "Aynı tarayıcı 30 gün içinde bir kez oy verir.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "inbox",
      group: "Yönetim",
      label: "Gelen sorular",
      description: "Bekleyen soruyu cevapla ya da sil. Cevap sayfada ve SSS şemasında görünür.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/admin/questions"],
    },
  ],
};
