"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Palette,
  Sparkles,
  LayoutTemplate,
  Plus,
  Upload,
  Download,
  Code2,
  Layers,
  Wand2,
  Store,
  CheckCircle2,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
  Eye,
  Sliders,
  HelpCircle,
  FileCode,
  Globe,
  Lock,
} from "lucide-react";
import type { BlockNode, TemplateKind } from "@nexpress/core";
import {
  saveCustomCodeAction,
  createStudioItemAction,
  exportStudioTemplateAction,
  importStudioTemplateAction,
} from "./actions";
import { generateDesignAction, saveDesignAction } from "../design-library/actions";

export interface StudioTemplateItem {
  id: string;
  slug: string;
  name: string;
  kind: TemplateKind;
  isDefault: boolean;
  category: string;
  blocksCount: number;
  blocks: BlockNode[];
  description: string;
}

export interface StudioLibraryItem {
  id: string;
  name: string;
  kind: string;
  category: string;
  description: string;
  source: string;
  blocksCount: number;
  createdAt: string;
}

interface StudioClientProps {
  initialTemplates: StudioTemplateItem[];
  initialLibrary: StudioLibraryItem[];
  currentCustomCss: string;
  currentHeaderScripts: string;
  currentFooterScripts: string;
}

export function StudioClient({
  initialTemplates,
  initialLibrary,
  currentCustomCss,
  currentHeaderScripts,
  currentFooterScripts,
}: StudioClientProps) {
  const [activeTab, setActiveTab] = useState<
    "templates" | "patterns" | "ai" | "library" | "code" | "marketplace"
  >("templates");

  const [templates, setTemplates] = useState(initialTemplates);
  const [library, setLibrary] = useState(initialLibrary);
  const [isPending, startTransition] = useTransition();

  // Bildirimler
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Özel Kod Form State
  const [customCss, setCustomCss] = useState(currentCustomCss);
  const [headerScripts, setHeaderScripts] = useState(currentHeaderScripts);
  const [footerScripts, setFooterScripts] = useState(currentFooterScripts);

  // Sihirbaz State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [selectedKind, setSelectedKind] = useState<TemplateKind>("page");
  const [selectedMethod, setSelectedMethod] = useState<"visual" | "ai" | "blank">("ai");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Genel");
  const [itemVisibility, setItemVisibility] = useState<"private" | "public" | "marketplace">("private");

  // AI Hızlı Üretim State
  const [aiMode, setAiMode] = useState<"section" | "page" | "theme">("section");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);

  // İçe Aktarma Modalı
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  // Özel Kodları Kaydet
  const handleSaveCode = () => {
    startTransition(async () => {
      const res = await saveCustomCodeAction({
        customCss,
        headerScripts,
        footerScripts,
      });
      if (res.ok) {
        showMsg("success", "Ek CSS ve JS kodları başarıyla kaydedildi ve ön yüzde aktif edildi.");
      } else {
        showMsg("error", res.error);
      }
    });
  };

  // Sihirbazı Başlat
  const handleCreateFromWizard = () => {
    if (!itemName.trim()) {
      showMsg("error", "Lütfen bir tasarım / şablon adı girin.");
      return;
    }

    startTransition(async () => {
      const res = await createStudioItemAction({
        name: itemName,
        kind: selectedKind,
        visibility: itemVisibility,
        category: itemCategory,
      });

      if (res.ok) {
        setIsWizardOpen(false);
        showMsg("success", `"${itemName}" başarıyla oluşturuldu.`);
        // Yeni şablonu listeye ekle
        setTemplates((prev) => [
          {
            id: res.contentId,
            slug: res.slug,
            name: itemName,
            kind: selectedKind,
            isDefault: false,
            category: itemCategory,
            blocksCount: 1,
            blocks: [],
            description: "",
          },
          ...prev,
        ]);
        setWizardStep(1);
        setItemName("");
      } else {
        showMsg("error", res.error);
      }
    });
  };

  // Şablon Dışa Aktar
  const handleExport = async (id: string) => {
    startTransition(async () => {
      const res = await exportStudioTemplateAction({ id });
      if (res.ok) {
        const blob = new Blob([res.json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename;
        a.click();
        URL.revokeObjectURL(url);
        showMsg("success", `${res.filename} başarıyla indirildi.`);
      } else {
        showMsg("error", res.error);
      }
    });
  };

  // Şablon İçe Aktar
  const handleImport = () => {
    if (!importJson.trim()) return;
    startTransition(async () => {
      const res = await importStudioTemplateAction({ json: importJson });
      if (res.ok) {
        setIsImportOpen(false);
        setImportJson("");
        showMsg("success", `"${res.name}" başarıyla içe aktarıldı.`);
      } else {
        showMsg("error", res.error);
      }
    });
  };

  // AI Üretim
  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) {
      showMsg("error", "Lütfen bir tasarım promptu yazın.");
      return;
    }

    startTransition(async () => {
      const res = await generateDesignAction({
        mode: aiMode,
        prompt: aiPrompt,
      });

      if (res.ok) {
        setAiResult(res.design);
        showMsg("success", "Yapay zeka tasarımı başarıyla üretti ve doğruladı.");
      } else {
        showMsg("error", res.error);
      }
    });
  };

  // AI Tasarımı Kütüphaneye Kaydet
  const handleSaveAiDesign = () => {
    if (!aiResult) return;
    startTransition(async () => {
      const res = await saveDesignAction({
        design: aiResult,
        name: aiResult.name || "AI Üretimi Tasarım",
        prompt: aiPrompt,
        source: "ai",
      });

      if (res.ok) {
        showMsg("success", "Tasarım kütüphanesine kaydedildi.");
        setAiResult(null);
        setAiPrompt("");
      } else {
        showMsg("error", res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Aksiyon Çubuğu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Tasarım Stüdyosu & Şablon Fabrikası
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Tüm şablonlar, modeller, AI tasarımları, canlı tema ayarları ve özel kodlar tek çatı altında.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card text-foreground hover:bg-muted transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>İçe Aktar (.nxtemplate)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setWizardStep(1);
              setIsWizardOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Tasarım Oluştur (Sihirbaz)</span>
          </button>
        </div>
      </div>

      {/* Bildirim Alanı */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
            msg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          <span>{msg.text}</span>
          <button
            type="button"
            onClick={() => setMsg(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* İkincil Sekmeler */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border text-xs sm:text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === "templates"
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>Şablonlar & Modeller ({templates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === "ai"
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>🤖 AI Tasarım Asistanı</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === "library"
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tasarım Kütüphanesi ({library.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("code")}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === "code"
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>⚙️ Özel Kodlar (Ek CSS & Ek JS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("marketplace")}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
            activeTab === "marketplace"
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Şablon & Tema Pazaryeri</span>
        </button>
      </div>

      {/* SEKME 1: ŞABLONLAR & MODELLER */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-blue-500/40 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {tpl.kind}
                    </span>
                    {tpl.isDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Varsayılan
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-foreground line-clamp-1">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {tpl.description || "Özelleştirilmiş site yerleşim şablonu."}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {tpl.blocksCount} blok
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExport(tpl.id)}
                      title="Dışa Aktar (.nxtemplate)"
                      className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      href={`/admin/contents?id=${tpl.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEKME 2: AI TASARIM STÜDYOSU */}
      {activeTab === "ai" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Yapay Zeka ile Tasarım Üretimi
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                İhtiyacınızı doğal dille anlatın, yapay zeka 100/100 uyumlu AST blokları üretsin.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Üretilecek Tasarım Türü
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["section", "page", "theme"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAiMode(m)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition ${
                      aiMode === m
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {m === "section" ? "🧩 Bölüm / Blok" : m === "page" ? "📄 Tam Sayfa" : "🎨 Renk & Tema"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Tasarım Promptu / Talimatı
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={5}
                placeholder="Örn: Muhasebe ve e-dönüşüm yazılımı için güven veren, koyu mavi tonlarda, 3 sütunlu fiyat tablosu ve 'Demo İste' butonu içeren modern bir kahraman alanı üret."
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <button
              type="button"
              disabled={isPending || !aiPrompt.trim()}
              onClick={handleAiGenerate}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isPending ? "Yapay Zeka Üretiyor..." : "AI ile Tasarımı Üret"}</span>
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-foreground">
              Üretim Önizlemesi & Kayıt
            </h2>

            {aiResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      {aiResult.name}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Skor: {aiResult.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {aiResult.description}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveAiDesign}
                    disabled={isPending}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kütüphaneye Kaydet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiResult(null)}
                    className="py-2.5 px-4 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground transition"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <Wand2 className="w-8 h-8 mx-auto opacity-30" />
                <p className="text-xs">
                  Sol tarafta prompt girip üretim yaptığınızda önizleme ve blok AST burada görüntülenecektir.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEKME 3: TASARIM KÜTÜPHANESİ */}
      {activeTab === "library" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {library.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground space-y-2">
              <Layers className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm font-medium">Henüz kayıtlı tasarım bulunamadı.</p>
              <p className="text-xs">AI ile tasarım üreterek veya şablon kaydederek kütüphanenizi doldurabilirsiniz.</p>
            </div>
          ) : (
            library.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.source === "ai" ? "🤖 AI Üretimi" : "✏️ Manuel"}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground line-clamp-1">{item.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* SEKME 4: ÖZEL KODLAR (EK CSS & EK JS) */}
      {activeTab === "code" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 space-y-1">
            <p className="font-bold">⚡ 100/100 Lighthouse & Güvenli Kod Mimarisi:</p>
            <p>
              Ek CSS kodları ayrı bir HTTP isteği oluşturmaz; sunucu tarafında temizlenip optimize edilerek doğrudan HTML içine inlined kritik CSS olarak gömülür.
              Header ve Footer scriptleri sayfa ilk açılışını kilitlemeyen Next.js Script stratejisiyle yüklenir.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol: Ek CSS */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Özel Ek CSS (Custom CSS)</h3>
                  <p className="text-xs text-muted-foreground">Sitenin genelinde veya şablonlarda geçerli CSS kuralları.</p>
                </div>
                <Code2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                rows={12}
                placeholder="/* Örnek Özel CSS */
.my-custom-btn {
  border-radius: 9999px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.1);
}"
                className="w-full text-xs font-mono p-3 rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sağ: Ek JS (Head & Footer Scripts) */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">&lt;head&gt; Özel Scriptleri</h3>
                    <p className="text-xs text-muted-foreground">Google Tag Manager, Meta Pixel vb. doğrulama etiketleri.</p>
                  </div>
                  <FileCode className="w-4 h-4 text-muted-foreground" />
                </div>
                <textarea
                  value={headerScripts}
                  onChange={(e) => setHeaderScripts(e.target.value)}
                  rows={5}
                  placeholder="<!-- <head> Scripti veya Meta Etiketi -->"
                  className="w-full text-xs font-mono p-3 rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">&lt;body&gt; Sonu Scriptleri</h3>
                    <p className="text-xs text-muted-foreground">Canlı destek, analitik sayaçlar veya kapanış betikleri.</p>
                  </div>
                  <FileCode className="w-4 h-4 text-muted-foreground" />
                </div>
                <textarea
                  value={footerScripts}
                  onChange={(e) => setFooterScripts(e.target.value)}
                  rows={5}
                  placeholder="<!-- <body> Kapanışı Öncesi Scriptleri -->"
                  className="w-full text-xs font-mono p-3 rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveCode}
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor..." : "Özel Kodları Kaydet ve Yayına Al"}
            </button>
          </div>
        </div>
      )}

      {/* SEKME 5: PAZARYERİ VE DAĞITIM */}
      {activeTab === "marketplace" && (
        <div className="p-8 rounded-2xl border border-border bg-card text-center space-y-4 max-w-2xl mx-auto shadow-xs">
          <Store className="w-12 h-12 mx-auto text-blue-600" />
          <h2 className="text-lg font-bold text-foreground">
            NexPress Şablon & Tema Pazaryeri (Marketplace)
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Tasarladığınız şablonları <code>.nxtemplate</code> paketi olarak dışa aktarabilir, başka sitelere yükleyebilir ya da yakında açılacak resmi NexPress Marketplace üzerinden satıp dağıtabilirsiniz.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Şablonlarımı Gör & Dışa Aktar
            </button>
          </div>
        </div>
      )}

      {/* SİHİRBAZ MODALI */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Yeni Tasarım / Şablon Sihirbazı
                </h3>
                <span className="text-xs text-muted-foreground">
                  Adım {wizardStep} / 3
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Adım 1: Nerede Kullanılacak? */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-foreground">
                  Bu tasarım nerede kullanılacak?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "header", label: "🌐 Header (Üst Bilgi)" },
                    { id: "footer", label: "🌐 Footer (Alt Bilgi)" },
                    { id: "sidebar", label: "🌐 Sidebar (Kenar Çubuğu)" },
                    { id: "page", label: "📄 Kurumsal Sayfa" },
                    { id: "post", label: "📝 Blog Detay Şablonu" },
                    { id: "product", label: "🛍️ Ürün Detay Şablonu" },
                    { id: "campaign", label: "📣 Kampanya Detayı" },
                    { id: "category", label: "📂 Kategori Arşivi" },
                    { id: "pattern", label: "🧩 Senkronize Model (Pattern)" },
                    { id: "search", label: "🔍 Arama Sayfası" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedKind(item.id as TemplateKind)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                        selectedKind === item.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    Devam Et →
                  </button>
                </div>
              </div>
            )}

            {/* Adım 2: Nasıl Oluşturulacak? */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-foreground">
                  Tasarımı nasıl oluşturmak istersiniz?
                </label>
                <div className="space-y-2.5">
                  {[
                    {
                      id: "ai",
                      title: "🤖 Yapay Zeka ile Otomatik Üret",
                      desc: "Prompt verin, AI saniyeler içinde blokları oluştursun.",
                    },
                    {
                      id: "visual",
                      title: "✏️ Görsel Blok Stüdyosunda Aç",
                      desc: "Novel / TipTap görsel editörüyle sıfırdan tasarlayın.",
                    },
                    {
                      id: "blank",
                      title: "📄 Hazır Başlangıç İskeleti ile Başla",
                      desc: "Standart şablon iskeletiyle hızlıca kurun.",
                    },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id as any)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        selectedMethod === m.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <h4 className="text-xs font-bold text-foreground">{m.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="py-2 px-4 rounded-xl border border-border text-xs font-semibold text-muted-foreground"
                  >
                    ← Geri
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    Devam Et →
                  </button>
                </div>
              </div>
            )}

            {/* Adım 3: İsim ve Dağıtım */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Tasarım / Şablon Adı
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Örn: Modern Fiyat Tablosu & Hero"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Kategori / Grup
                  </label>
                  <input
                    type="text"
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    placeholder="Örn: Kurumsal, E-Ticaret, Kampanya"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Dağıtım & Görünürlük
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "private", label: "🔒 Özel (Sadece Bu Site)" },
                      { id: "public", label: "🌐 Paylaşılabilir" },
                      { id: "marketplace", label: "🛒 Pazaryeri Adayı" },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setItemVisibility(v.id as any)}
                        className={`p-2.5 text-[11px] font-semibold rounded-xl border text-center transition ${
                          itemVisibility === v.id
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="py-2 px-4 rounded-xl border border-border text-xs font-semibold text-muted-foreground"
                  >
                    ← Geri
                  </button>
                  <button
                    type="button"
                    disabled={isPending || !itemName.trim()}
                    onClick={handleCreateFromWizard}
                    className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50"
                  >
                    {isPending ? "Oluşturuluyor..." : "Tasarımı Oluştur"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* İÇE AKTARMA MODALI */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                .nxtemplate Şablon Paketi İçe Aktar
              </h3>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Dışa aktarılmış <code>.nxtemplate.json</code> dosyasının içeriğini aşağıdaki alana yapıştırın.
            </p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={8}
              placeholder='{ "manifest": { ... }, "blocks": [ ... ] }'
              className="w-full text-xs font-mono p-3 rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="py-2 px-4 rounded-xl border border-border text-xs font-semibold text-muted-foreground"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={isPending || !importJson.trim()}
                onClick={handleImport}
                className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50"
              >
                {isPending ? "İçe Aktarılıyor..." : "Şablonu Kur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

