import { CHOICE_FIELD_TYPES, CONTENT_FIELD_TYPES, ratingMax, type FormField } from "./form-spec";

export interface AnalyticsSubmission {
  createdAt: Date;
  status: string;
  pagePath: string;
  fields: Array<{ name: string; value: string; values?: string[] }>;
}

export interface FieldInsight {
  name: string;
  label: string;
  type: string;
  /** Bu alanı dolduran gönderim oranı (0–1) */
  fillRate: number;
  answered: number;
  /** Seçmeli alanlar ve puanlar: değer → adet */
  distribution?: Array<{ label: string; count: number }>;
  /** rating / scale / number */
  average?: number;
  min?: number;
  max?: number;
  /** NPS (yalnızca `scale`): destekçi − eleştirmen yüzdesi */
  nps?: number;
  /** Metin alanları */
  avgLength?: number;
  topWords?: Array<{ word: string; count: number }>;
  /** E-posta alanları: alan adı dağılımı */
  topDomains?: Array<{ label: string; count: number }>;
}

export interface FormAnalytics {
  total: number;
  byStatus: Record<string, number>;
  spamRate: number;
  /** Son `days` gün, eskiden yeniye (YYYY-MM-DD) */
  daily: Array<{ day: string; count: number }>;
  weekday: number[];
  hour: number[];
  topPages: Array<{ label: string; count: number }>;
  fields: FieldInsight[];
  first: Date | null;
  last: Date | null;
}

const STOP = new Set(
  "ve veya ile bir bu şu o için de da ki mi ben biz sen siz çok daha gibi ama fakat ne nasıl var yok the a an and or of to in on is are was for with it this that be as at by from i you we have has not but".split(" ")
);

const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr")).slice(0, n).map(([label, count]) => ({ label, count }));
const dayKey = (d: Date, tzOffsetMin: number) => new Date(d.getTime() + tzOffsetMin * 60_000).toISOString().slice(0, 10);

/**
 * Gönderimlerden özet çıkarır (saf; DB'siz). Spam gönderimler alan içgörülerine katılmaz.
 * `tzOffsetMin`: gün/saat kovaları için saat dilimi farkı (dakika).
 */
export function analyzeSubmissions(defs: FormField[], subs: AnalyticsSubmission[], opts: { days?: number; now?: Date; tzOffsetMin?: number } = {}): FormAnalytics {
  const days = opts.days ?? 30;
  const now = opts.now ?? new Date();
  const tz = opts.tzOffsetMin ?? 0;
  const byStatus: Record<string, number> = {};
  const pages = new Map<string, number>();
  const weekday = Array<number>(7).fill(0);
  const hour = Array<number>(24).fill(0);
  const dayCount = new Map<string, number>();
  for (const s of subs) {
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
    if (s.status === "spam") continue;
    pages.set(s.pagePath, (pages.get(s.pagePath) ?? 0) + 1);
    const local = new Date(s.createdAt.getTime() + tz * 60_000);
    weekday[(local.getUTCDay() + 6) % 7]!++; // Pzt=0
    hour[local.getUTCHours()]!++;
    const k = dayKey(s.createdAt, tz);
    dayCount.set(k, (dayCount.get(k) ?? 0) + 1);
  }
  const daily: FormAnalytics["daily"] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(new Date(now.getTime() - i * 86_400_000), tz);
    daily.push({ day: k, count: dayCount.get(k) ?? 0 });
  }
  const real = subs.filter((s) => s.status !== "spam");
  const fields: FieldInsight[] = [];
  for (const d of defs) {
    if (CONTENT_FIELD_TYPES.has(d.type)) continue;
    const answers = real.map((s) => s.fields.find((x) => x.name === d.name)).filter((x): x is NonNullable<typeof x> => !!x && x.value !== "");
    const ins: FieldInsight = { name: d.name, label: d.label, type: d.type, answered: answers.length, fillRate: real.length ? answers.length / real.length : 0 };
    if (CHOICE_FIELD_TYPES.has(d.type) || d.type === "checkbox") {
      const m = new Map<string, number>(d.options.map((o) => [o, 0]));
      for (const a of answers) for (const v of a.values ?? [a.value]) m.set(v, (m.get(v) ?? 0) + 1);
      ins.distribution = [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    } else if (d.type === "rating" || d.type === "scale" || d.type === "number") {
      const nums = answers.map((a) => Number(a.value)).filter(Number.isFinite);
      if (nums.length) {
        ins.average = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
        ins.min = Math.min(...nums);
        ins.max = Math.max(...nums);
        if (d.type !== "number") {
          const lo = d.type === "scale" ? 0 : 1;
          const hi = d.type === "scale" ? 10 : ratingMax(d);
          const m = new Map<string, number>();
          for (let n = lo; n <= hi; n++) m.set(String(n), 0);
          for (const n of nums) m.set(String(n), (m.get(String(n)) ?? 0) + 1);
          ins.distribution = [...m.entries()].map(([label, count]) => ({ label, count }));
        }
        if (d.type === "scale") {
          const p = nums.filter((n) => n >= 9).length;
          const c = nums.filter((n) => n <= 6).length;
          ins.nps = Math.round(((p - c) / nums.length) * 100);
        }
      }
    } else if (d.type === "email") {
      const m = new Map<string, number>();
      for (const a of answers) {
        const dom = a.value.split("@")[1]?.toLowerCase();
        if (dom) m.set(dom, (m.get(dom) ?? 0) + 1);
      }
      ins.topDomains = top(m, 5);
    } else if (d.type === "text" || d.type === "textarea") {
      ins.avgLength = answers.length ? Math.round(answers.reduce((n, a) => n + a.value.length, 0) / answers.length) : 0;
      if (d.type === "textarea" || d.type === "text") {
        const m = new Map<string, number>();
        for (const a of answers) for (const w of new Set(a.value.toLocaleLowerCase("tr").split(/[^\p{L}\p{N}]+/u))) if (w.length > 3 && !STOP.has(w) && !/^\d+$/.test(w)) m.set(w, (m.get(w) ?? 0) + 1);
        ins.topWords = top(m, 8).filter((x) => x.count > 1).map(({ label, count }) => ({ word: label, count }));
      }
    }
    fields.push(ins);
  }
  const times = subs.map((s) => s.createdAt.getTime());
  return {
    total: subs.length,
    byStatus,
    spamRate: subs.length ? (byStatus.spam ?? 0) / subs.length : 0,
    daily,
    weekday,
    hour,
    topPages: top(pages, 5),
    fields,
    first: times.length ? new Date(Math.min(...times)) : null,
    last: times.length ? new Date(Math.max(...times)) : null,
  };
}
