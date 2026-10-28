/**
 * RAG için başlık duyarlı Markdown parçalayıcı (saf, bağımlılıksız).
 * - Başlık yolu (`H1 > H2`) her parçaya bağlam olarak eşlik eder.
 * - Kod çiti, tablo ve liste blokları bölünmez; çok büyük tek blok cümle sınırında bölünür.
 * - Bitişik parçalar `overlapWords` kelime örtüşür (cümle ortasında kopan anlamı korur).
 */
export interface Chunk {
  index: number;
  headingPath: string;
  text: string;
  wordCount: number;
  /** İçerik özeti (FNV-1a 64): değişmeyen parçanın yeniden gömülmesini önler. */
  hash: string;
}

export interface ChunkOptions {
  title?: string;
  tldr?: string | null;
  maxWords?: number;
  minWords?: number;
  overlapWords?: number;
}

const wordsOf = (text: string) => text.split(/\s+/).filter(Boolean);

/** FNV-1a 64 bit, onaltılı. Güvenlik amaçlı değil, değişiklik tespiti içindir. */
export function fnv1a64(input: string): string {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (const byte of new TextEncoder().encode(input)) {
    h ^= BigInt(byte);
    h = (h * prime) & mask;
  }
  return h.toString(16).padStart(16, "0");
}

interface Block {
  headingPath: string;
  text: string;
}

/** Markdown'ı başlık yoluyla etiketlenmiş bloklara ayırır. */
function toBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const stack: Array<{ level: number; title: string }> = [];
  let buffer: string[] = [];
  let inFence = false;

  const path = () => stack.map((h) => h.title).join(" > ");
  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ headingPath: path(), text });
    buffer = [];
  };

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      buffer.push(line);
      continue;
    }
    if (inFence) {
      buffer.push(line);
      continue;
    }
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1]!.length;
      while (stack.length > 0 && stack[stack.length - 1]!.level >= level) stack.pop();
      stack.push({ level, title: heading[2]!.replace(/[*_`]/g, "").trim() });
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    buffer.push(line);
  }
  flush();
  return blocks;
}

/** Tek büyük bloğu cümle sınırlarında `maxWords` altına böler. */
function splitLarge(text: string, maxWords: number): string[] {
  if (wordsOf(text).length <= maxWords) return [text];
  const sentences = text.split(/(?<=[.!?…])\s+|\n/).filter(Boolean);
  const parts: string[] = [];
  let current: string[] = [];
  let count = 0;
  for (const sentence of sentences) {
    const n = wordsOf(sentence).length;
    if (count + n > maxWords && current.length > 0) {
      parts.push(current.join(" "));
      current = [];
      count = 0;
    }
    if (n > maxWords) {
      // Noktalama içermeyen dev satır: kelime sayısına göre kes
      const w = wordsOf(sentence);
      for (let i = 0; i < w.length; i += maxWords) parts.push(w.slice(i, i + maxWords).join(" "));
      continue;
    }
    current.push(sentence);
    count += n;
  }
  if (current.length > 0) parts.push(current.join(" "));
  return parts;
}

export function chunkMarkdown(markdown: string, options: ChunkOptions = {}): Chunk[] {
  const maxWords = options.maxWords ?? 220;
  const minWords = options.minWords ?? 40;
  const overlapWords = Math.min(options.overlapWords ?? 30, Math.floor(maxWords / 3));

  const pieces: Block[] = [];
  const lead = [options.title?.trim(), options.tldr?.trim()].filter(Boolean).join("\n");
  if (lead) pieces.push({ headingPath: options.title?.trim() ?? "", text: lead });
  for (const block of toBlocks(markdown)) {
    // Başlıkla aynı olan ilk satır (belge başlığı) tekrar edilmesin
    for (const part of splitLarge(block.text, maxWords)) pieces.push({ headingPath: block.headingPath, text: part });
  }

  // Aynı başlık yolundaki küçük blokları `maxWords` dolana dek birleştir
  const merged: Block[] = [];
  for (const piece of pieces) {
    const last = merged[merged.length - 1];
    if (last && last.headingPath === piece.headingPath && wordsOf(last.text).length + wordsOf(piece.text).length <= maxWords) {
      last.text = `${last.text}\n\n${piece.text}`;
    } else {
      merged.push({ ...piece });
    }
  }
  // Çok kısa son/ara parçayı bir öncekine kat (başlık yolu farklıysa bile anlam kopmasın)
  const compact: Block[] = [];
  for (const block of merged) {
    const last = compact[compact.length - 1];
    if (last && wordsOf(block.text).length < minWords && wordsOf(last.text).length + wordsOf(block.text).length <= maxWords) {
      last.text = `${last.text}\n\n${block.text}`;
    } else {
      compact.push({ ...block });
    }
  }

  return compact.map((block, index) => {
    let text = block.text;
    if (index > 0 && overlapWords > 0) {
      const tail = wordsOf(compact[index - 1]!.text).slice(-overlapWords).join(" ");
      if (tail && block.headingPath === compact[index - 1]!.headingPath) text = `${tail} …\n\n${text}`;
    }
    return {
      index,
      headingPath: block.headingPath,
      text,
      wordCount: wordsOf(text).length,
      hash: fnv1a64(`${block.headingPath}\n${text}`),
    };
  });
}

/** Gömme girdisi: bağlam için başlık yolu metnin önüne eklenir (saklanan metin değişmez). */
export function embeddingInputOf(chunk: Pick<Chunk, "headingPath" | "text">, title?: string): string {
  const context = [title, chunk.headingPath && chunk.headingPath !== title ? chunk.headingPath : ""].filter(Boolean).join(" — ");
  return context ? `${context}\n${chunk.text}` : chunk.text;
}
