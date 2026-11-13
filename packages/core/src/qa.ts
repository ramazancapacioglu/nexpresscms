/**
 * Soru-cevap durumu (saf). WordPress AI Prompt eklentisindeki gibi kaynak sayfanın üstünde durur:
 * bekleyen ziyaretçi soruları, cevaplanmış sorular ve faydalı oy sayısı. HTML kabul edilmez.
 */

export interface QaItem {
  id: string;
  question: string;
  name: string;
  answer: string;
  date: string;
}

export interface QaState {
  upvotes: number;
  pending: QaItem[];
  answered: QaItem[];
}

const MAX_PENDING = 50;
const MAX_ANSWERED = 100;

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

function readItem(raw: unknown, withAnswer: boolean): QaItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = text(row.id, 40);
  const question = text(row.question, 500);
  if (!/^q_[a-z0-9_]+$/i.test(id) || question.length < 10) return null;
  return {
    id,
    question,
    name: text(row.name, 80),
    answer: withAnswer ? text(row.answer, 4000) : "",
    date: text(row.date, 32),
  };
}

/** Bozuk kayıtlar atılır; listeler üst sınırda kesilir. */
export function sanitizeQaState(value: unknown): QaState {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const up = Number(row.upvotes);
  const pending = (Array.isArray(row.pending) ? row.pending : []).map((item) => readItem(item, false)).filter((item): item is QaItem => Boolean(item)).slice(0, MAX_PENDING);
  const answered = (Array.isArray(row.answered) ? row.answered : []).map((item) => readItem(item, true)).filter((item): item is QaItem => Boolean(item && item.answer.length > 0)).slice(0, MAX_ANSWERED);
  return { upvotes: Number.isFinite(up) && up > 0 ? Math.min(Math.floor(up), 1_000_000) : 0, pending, answered };
}

/** Yeni soru kimliği. Çağıran rastgele parça verir. */
export function qaItemId(nonce: string): string {
  const clean = nonce.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  return `q_${Date.now().toString(36)}_${clean || "x"}`;
}
