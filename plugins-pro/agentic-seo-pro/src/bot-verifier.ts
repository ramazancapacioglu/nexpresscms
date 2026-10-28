/**
 * Bot imzaları çekirdektedir (`@nexpress/core`, `ai-bots.ts`); sayaçlar `bot_daily_stats` tablosundadır.
 * Bu modül eski adlarla yeniden dışa aktarır.
 */
export {
  KNOWN_BOTS as KNOWN_AI_BOTS,
  detectBot as detectAiBotFromUserAgent,
  type BotSignature as AiBotSignature,
} from "@nexpress/core";
