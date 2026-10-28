import type { BlockNode } from "@nexpress/core";

/**
 * Editör İçinde Hızlı Eklenebilen Atomik Elementler & Satır/Sütun Konteynerleri
 */
export const ATOMIC_ELEMENTS_QUICK_BAR: Array<{
  id: string;
  label: string;
  block: BlockNode;
}> = [
  {
    id: "quick_row_2col",
    label: "2 Sütun Satır",
    block: {
      id: "blk_cols_2",
      type: "columns",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { layout: "6+6", gap: "24px", verticalAlign: "stretch" },
      children: [
        {
          id: "blk_col_left",
          type: "column",
          props: { widthPct: 50 },
          style: {
            paddingTop: "20px",
            paddingRight: "20px",
            paddingBottom: "20px",
            paddingLeft: "20px",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            borderWidth: "1px",
            borderColor: "#e2e8f0",
          },
          children: [
            { id: "blk_col_l_h", type: "heading", props: { level: 3, text: "Sol Sütun" } },
            { id: "blk_col_l_p", type: "paragraph", props: { text: "Sol sütun içeriği." } },
          ],
        },
        {
          id: "blk_col_right",
          type: "column",
          props: { widthPct: 50 },
          style: {
            paddingTop: "20px",
            paddingRight: "20px",
            paddingBottom: "20px",
            paddingLeft: "20px",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            borderWidth: "1px",
            borderColor: "#e2e8f0",
          },
          children: [
            { id: "blk_col_r_h", type: "heading", props: { level: 3, text: "Sağ Sütun" } },
            { id: "blk_col_r_p", type: "paragraph", props: { text: "Sağ sütun içeriği." } },
          ],
        },
      ],
    },
  },
  {
    id: "quick_section",
    label: "Kapsayıcı Bölüm (Section)",
    block: {
      id: "blk_sec",
      type: "section",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { title: "", containerMode: "boxed" },
      style: {
        paddingTop: "32px",
        paddingRight: "32px",
        paddingBottom: "32px",
        paddingLeft: "32px",
        backgroundColor: "#f8fafc",
        borderRadius: "16px",
        borderWidth: "1px",
        borderColor: "#e2e8f0",
      },
      children: [
        { id: "blk_sec_h", type: "heading", props: { level: 2, text: "Bölüm Başlığı" } },
        { id: "blk_sec_p", type: "paragraph", props: { text: "Bölüm içi açıklama paragrafı." } },
      ],
    },
  },
  {
    id: "quick_heading",
    label: "Başlık (H2/H3)",
    block: {
      id: "blk_h",
      type: "heading",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { level: 2, text: "Yeni Alt Başlık", align: "left" },
    },
  },
  {
    id: "quick_paragraph",
    label: "Paragraf",
    block: {
      id: "blk_p",
      type: "paragraph",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        text: "Buraya yüksek okunabilirlikli, hem okuyucular hem de yapay zeka özetleyicileri için net ve bilgilendirici paragraf metninizi yazın.",
      },
    },
  },
  {
    id: "quick_list",
    label: "Madde Listesi",
    block: {
      id: "blk_list",
      type: "list_element",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        listType: "check",
        items: [
          "100/100 Core Web Vitals ve 0 KB istemci JS",
          "Otomatik JSON-LD Schema ve 301 yönlendirme motoru",
          "Esnek satır, sütun ve duyarlı (responsive) stil kontrolü",
        ],
      },
    },
  },
  {
    id: "quick_quote",
    label: "Alıntı (Quote)",
    block: {
      id: "blk_quote",
      type: "quote",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        quote: "Görsel esneklik ile 100/100 hız arasında seçim yapmak zorunda değilsiniz.",
        author: "NexPress Mimari Ekibi",
        role: "Mühendislik Raporu",
      },
    },
  },
  {
    id: "quick_button",
    label: "Buton",
    block: {
      id: "blk_btn",
      type: "button_element",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        label: "Detaylı İncele →",
        href: "/tr/nexpress-enterprise-cloud",
        styleVariant: "primary",
        align: "left",
      },
    },
  },
  {
    id: "quick_image",
    label: "Görsel (SEO)",
    block: {
      id: "blk_img",
      type: "image_figure",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'><rect width='1200' height='630' fill='%230F172A'/><circle cx='980' cy='140' r='260' fill='%231E3A8A' opacity='0.45'/><text x='80' y='260' fill='%23FFFFFF' font-family='sans-serif' font-size='46' font-weight='bold'>NexPress SEO Optimize Görsel</text><text x='80' y='340' fill='%2394A3B8' font-family='sans-serif' font-size='24'>Alt Text • Title • Figcaption • Focal Point</text></svg>",
        altText: "NexPress CMS Mimari Görseli — Alt metin SEO açıklaması",
        titleText: "NexPress Görsel Başlığı",
        caption: "Görsel altı açıklaması (figcaption) — arama motorları için bağlamsal sinyal sağlar.",
        aspectRatio: "16:9",
      },
    },
  },
  {
    id: "quick_table",
    label: "Tablo",
    block: {
      id: "blk_tbl",
      type: "comparison_table",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        title: "Karşılaştırma Tablosu",
        headers: ["Kriter", "NexPress CMS", "Klasik CMS"],
        rows: [
          ["İstemci JS", "0 KB (Saf RSC)", "800+ KB"],
          ["SEO Motoru", "Yerleşik Otomatik", "Eklenti Bağımlı"],
        ],
      },
    },
  },
  {
    id: "quick_review",
    label: "İnceleme & Puan",
    block: {
      id: "blk_rev",
      type: "review_box",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: {
        itemName: "NexPress Enterprise Cloud",
        rating: 4.9,
        verdict: "Kurumsal ekipler için en hızlı 0-KB RSC ve Agentic SEO altyapısı.",
        pros: ["100/100 Core Web Vitals", "Sıfır kayıplı MarkdownCache", "Attio kalitesinde stüdyo arayüzü"],
        cons: ["Geleneksel PHP temalarını desteklemez"],
      },
    },
  },
  {
    id: "quick_divider",
    label: "Ayırıcı Çizgi",
    block: {
      id: "blk_div",
      type: "divider_spacer",
      gridSpan: { desktop: 12, tablet: 12, mobile: 12 },
      props: { style: "line", spacingPx: 32 },
    },
  },
];
