import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { qaItemId, sanitizeQaState, type QaItem, type QaState } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";

const secret = () => process.env.AUTH_SECRET || "nexpress-dev-secret";

/** Toplama sorusu: cevap imzada, düz metin olarak gitmez. */
export function qaCaptcha(): { a: number; b: number; token: string } {
  const a = 1 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 8);
  const exp = Math.floor(Date.now() / 1000) + 20 * 60;
  const body = `${a + b}.${exp}`;
  const mac = createHmac("sha256", secret()).update(`qa|${body}`).digest("base64url").slice(0, 32);
  return { a, b, token: `${body}.${mac}` };
}

export function qaCaptchaOk(token: unknown, answer: unknown): boolean {
  if (typeof token !== "string" || token.length > 80) return false;
  const [sumRaw, expRaw, mac] = token.split(".");
  const sum = Number(sumRaw);
  const exp = Number(expRaw);
  const given = Number(String(answer ?? "").trim());
  if (!Number.isInteger(sum) || !Number.isInteger(exp) || !Number.isInteger(given) || !mac) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", secret()).update(`qa|${sum}.${exp}`).digest("base64url").slice(0, 32);
  const a = Buffer.from(expected);
  const b = Buffer.from(mac);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return given === sum;
}

export async function readQa(siteId: string, contentId: string): Promise<QaState> {
  const row = await getScopedRepository(siteId).getContentById(contentId, "tr");
  return sanitizeQaState(row?.schemaAttributes && (row.schemaAttributes as Record<string, unknown>)._qa);
}

export async function writeQa(siteId: string, contentId: string, state: QaState): Promise<boolean> {
  return getScopedRepository(siteId).saveQaState(contentId, sanitizeQaState(state));
}

/** Bekleyen soru ekler. Aynı metin zaten duruyorsa ikinci kez yazılmaz. */
export async function appendPendingQuestion(siteId: string, contentId: string, question: string, name: string): Promise<QaState | null> {
  const state = await readQa(siteId, contentId);
  const clean = question.replace(/\s+/g, " ").trim();
  if (state.pending.some((item) => item.question === clean) || state.answered.some((item) => item.question === clean)) return state;
  const item: QaItem = {
    id: qaItemId(randomBytes(4).toString("hex")),
    question: clean,
    name: name.replace(/\s+/g, " ").trim().slice(0, 80),
    answer: "",
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
  };
  const next = sanitizeQaState({ ...state, pending: [...state.pending, item] });
  return (await writeQa(siteId, contentId, next)) ? next : null;
}

export function answerPending(state: QaState, id: string, answer: string): QaState {
  const item = state.pending.find((row) => row.id === id);
  if (!item) return state;
  const answered: QaItem = { ...item, answer: answer.replace(/\s+/g, " ").trim().slice(0, 4000), date: new Date().toISOString().slice(0, 16).replace("T", " ") };
  return sanitizeQaState({
    ...state,
    pending: state.pending.filter((row) => row.id !== id),
    answered: [...state.answered, answered],
  });
}
