import net from "node:net";
import tls from "node:tls";

/**
 * Minimal Redis istemcisi (yalnızca Node; RESP2). Bağımlılık eklememek için `net`/`tls` üzerinde yazıldı ve yalnızca
 * paylaşımlı durum için gereken tek tek komutları destekler (`GET`, `SET`, `INCR`, `PEXPIRE`, `DEL`…). Bağlantı tembel
 * kurulur, istek başına zaman aşımı vardır, kopunca sonraki komutta (geri çekilme süresiyle) yeniden bağlanır.
 * **Hata durumunda `undefined` döner** (istek patlamaz): çağıranlar süreç içi yedeğe düşer (fail-open).
 */

export type RespValue = string | number | null | RespValue[];

/** Komutu RESP2 dizisi olarak kodlar. */
export function encodeCommand(args: ReadonlyArray<string | number>): Buffer {
  const parts: Buffer[] = [Buffer.from(`*${args.length}\r\n`)];
  for (const a of args) {
    const b = Buffer.from(String(a));
    parts.push(Buffer.from(`$${b.length}\r\n`), b, Buffer.from("\r\n"));
  }
  return Buffer.concat(parts);
}

export class RespError extends Error {}

/** Artımlı RESP2 çözücü: parça parça gelen veriden tam yanıtları çıkarır. */
export class RespParser {
  private buf: Buffer = Buffer.alloc(0);

  /** Yeni veri ekler; tamamlanan yanıtları sırayla döner (hata yanıtı `RespError` örneğidir). */
  public push(chunk: Buffer): Array<RespValue | RespError> {
    this.buf = this.buf.length === 0 ? chunk : Buffer.concat([this.buf, chunk]);
    const out: Array<RespValue | RespError> = [];
    for (;;) {
      const parsed = this.parseAt(0);
      if (!parsed) break;
      out.push(parsed.value);
      this.buf = this.buf.subarray(parsed.next);
    }
    return out;
  }

  private line(at: number): { text: string; next: number } | null {
    const i = this.buf.indexOf("\r\n", at, "latin1");
    return i < 0 ? null : { text: this.buf.toString("utf8", at, i), next: i + 2 };
  }

  private parseAt(at: number): { value: RespValue | RespError; next: number } | null {
    if (at >= this.buf.length) return null;
    const type = String.fromCharCode(this.buf[at]!);
    const l = this.line(at + 1);
    if (!l) return null;
    switch (type) {
      case "+":
        return { value: l.text, next: l.next };
      case "-":
        return { value: new RespError(l.text), next: l.next };
      case ":":
        return { value: Number(l.text), next: l.next };
      case "$": {
        const len = Number(l.text);
        if (len < 0) return { value: null, next: l.next };
        if (this.buf.length < l.next + len + 2) return null;
        return { value: this.buf.toString("utf8", l.next, l.next + len), next: l.next + len + 2 };
      }
      case "*": {
        const n = Number(l.text);
        if (n < 0) return { value: null, next: l.next };
        const items: RespValue[] = [];
        let cursor = l.next;
        for (let i = 0; i < n; i++) {
          const item = this.parseAt(cursor);
          if (!item) return null;
          items.push(item.value instanceof RespError ? null : item.value);
          cursor = item.next;
        }
        return { value: items, next: cursor };
      }
      default:
        throw new RespError(`Bilinmeyen RESP türü: ${type}`);
    }
  }
}

export interface RedisTarget {
  host: string;
  port: number;
  tls: boolean;
  password: string | null;
  username: string | null;
  db: number;
}

/** `redis://[kullanıcı:parola@]sunucu[:port][/db]` ya da `rediss://` (TLS). Geçersizse `null`. */
export function parseRedisUrl(url: string | undefined): RedisTarget | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "redis:" && u.protocol !== "rediss:") return null;
    const db = u.pathname.length > 1 ? Number(u.pathname.slice(1)) : 0;
    if (!u.hostname || !Number.isInteger(db) || db < 0) return null;
    return { host: u.hostname, port: u.port ? Number(u.port) : 6379, tls: u.protocol === "rediss:", username: u.username ? decodeURIComponent(u.username) : null, password: u.password ? decodeURIComponent(u.password) : null, db };
  } catch {
    return null;
  }
}

interface Pending {
  resolve: (v: RespValue | undefined) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class RedisClient {
  private socket: net.Socket | null = null;
  private parser = new RespParser();
  private queue: Pending[] = [];
  private connecting: Promise<boolean> | null = null;
  private downUntil = 0;

  constructor(
    private readonly target: RedisTarget,
    private readonly options: { timeoutMs?: number; backoffMs?: number } = {}
  ) {}

  private get timeoutMs() {
    return this.options.timeoutMs ?? 500;
  }

  private fail(): void {
    this.downUntil = Date.now() + (this.options.backoffMs ?? 5_000);
    const pending = this.queue.splice(0);
    for (const p of pending) {
      clearTimeout(p.timer);
      p.resolve(undefined);
    }
    this.socket?.destroy();
    this.socket = null;
    this.connecting = null;
  }

  private connect(): Promise<boolean> {
    if (this.socket && !this.socket.destroyed) return Promise.resolve(true);
    if (Date.now() < this.downUntil) return Promise.resolve(false);
    this.connecting ??= new Promise<boolean>((resolve) => {
      const t = this.target;
      const sock = t.tls ? tls.connect({ host: t.host, port: t.port, servername: t.host }) : net.connect({ host: t.host, port: t.port });
      sock.setNoDelay(true);
      this.parser = new RespParser();
      const give = setTimeout(() => { this.fail(); resolve(false); }, this.timeoutMs * 4);
      sock.on("data", (chunk) => {
        try {
          for (const value of this.parser.push(chunk)) {
            const p = this.queue.shift();
            if (!p) continue;
            clearTimeout(p.timer);
            p.resolve(value instanceof RespError ? undefined : value);
          }
        } catch {
          this.fail();
        }
      });
      sock.on("error", () => this.fail());
      sock.on("close", () => this.fail());
      sock.once(t.tls ? "secureConnect" : "connect", async () => {
        clearTimeout(give);
        this.socket = sock;
        // Kimlik doğrulama ve veritabanı seçimi; başarısızsa bağlantı kullanılmaz
        const ok = (await this.raw(t.password ? (t.username ? ["AUTH", t.username, t.password] : ["AUTH", t.password]) : ["PING"])) !== undefined && (t.db === 0 || (await this.raw(["SELECT", t.db])) !== undefined);
        if (!ok) this.fail();
        resolve(ok);
      });
    }).finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  private raw(args: ReadonlyArray<string | number>): Promise<RespValue | undefined> {
    return new Promise((resolve) => {
      const sock = this.socket;
      if (!sock || sock.destroyed) return resolve(undefined);
      const timer = setTimeout(() => {
        const i = this.queue.findIndex((p) => p.timer === timer);
        if (i >= 0) this.queue.splice(i, 1);
        resolve(undefined);
        // Yanıt sırası bozulmasın diye zaman aşımı sonrası bağlantı yenilenir
        this.fail();
      }, this.timeoutMs);
      this.queue.push({ resolve, timer });
      sock.write(encodeCommand(args), (err) => {
        if (err) this.fail();
      });
    });
  }

  /** Komutu çalıştırır. Bağlantı/zaman aşımı/Redis hatasında `undefined` döner (asla fırlatmaz). */
  public async command(args: ReadonlyArray<string | number>): Promise<RespValue | undefined> {
    try {
      if (!(await this.connect())) return undefined;
      return await this.raw(args);
    } catch {
      this.fail();
      return undefined;
    }
  }

  public close(): void {
    this.fail();
    this.downUntil = 0;
  }
}
