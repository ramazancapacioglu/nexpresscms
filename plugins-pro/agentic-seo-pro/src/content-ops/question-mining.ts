/**
 * 8 Kaynaklı Hibrit Soru Madenciliği (`question-intel`) ve Vektör Kümeleme (Cosine > 0.92)
 */
export interface MinedQuestionCluster {
  id: string;
  canonicalQuestion: string;
  sourceChannel:
    | "gsc_pos_4_20"
    | "serper_paa"
    | "bing_webmaster"
    | "support_hub"
    | "mcp_query_log";
  cosineClusterScore: number;
  impressions30d: number;
  recommendedTargetType: "ai_prompt" | "kb_tech" | "product";
  suggestedSlug: string;
  status: "ready_for_2pass" | "published";
}

export const SAMPLE_MINED_QUESTIONS: MinedQuestionCluster[] = [
  {
    id: "q_cluster_1",
    canonicalQuestion: "Next.js 15 RSC tabanlı CMS ile WordPress hız farkı nedir?",
    sourceChannel: "gsc_pos_4_20",
    cosineClusterScore: 0.95,
    impressions30d: 4820,
    recommendedTargetType: "ai_prompt",
    suggestedSlug: "neden-wordpress-yerine-nexpress-cms",
    status: "published",
  },
  {
    id: "q_cluster_2",
    canonicalQuestion: "llms.txt ve ?format=md yapay zeka botlarının tarama bütçesini nasıl etkiler?",
    sourceChannel: "serper_paa",
    cosineClusterScore: 0.93,
    impressions30d: 3150,
    recommendedTargetType: "kb_tech",
    suggestedSlug: "llms-txt-ve-format-md-rehberi",
    status: "ready_for_2pass",
  },
  {
    id: "q_cluster_3",
    canonicalQuestion: "Kurumsal e-ticaret sitelerinde Product ve Offer @id şema bağlantısı nasıl kurulur?",
    sourceChannel: "mcp_query_log",
    cosineClusterScore: 0.94,
    impressions30d: 1940,
    recommendedTargetType: "kb_tech",
    suggestedSlug: "kurumsal-product-offer-id-entity-graph",
    status: "ready_for_2pass",
  },
];
