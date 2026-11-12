import assert from "node:assert/strict";
import net from "node:net";
import test, { after } from "node:test";
import { RedisClient, RespError, RespParser, encodeCommand, parseRedisUrl } from "../src/redis-client";

test("RESP kodlama: dizi, toplu dize uzunluğu bayt cinsinden (Türkçe karakter)", () => {
  assert.equal(encodeCommand(["SET", "anahtar", "şğ"]).toString(), "*3\r\n$3\r\nSET\r\n$7\r\nanahtar\r\n$4\r\nşğ\r\n");
  assert.equal(encodeCommand(["INCR", 5]).toString(), "*2\r\n$4\r\nINCR\r\n$1\r\n5\r\n");
});

test("RESP çözme: türler, parça parça veri, boş/null, hata, iç içe dizi", () => {
  const p = new RespParser();
  assert.deepEqual(p.push(Buffer.from("+OK\r\n:42\r\n$-1\r\n$5\r\nhel")), ["OK", 42, null]);
  assert.deepEqual(p.push(Buffer.from("lo\r\n*2\r\n$1\r\na\r\n:7\r\n")), ["hello", ["a", 7]]);
  const [err] = p.push(Buffer.from("-ERR kötü komut\r\n"));
  assert.ok(err instanceof RespError && /kötü/.test(err.message));
  assert.deepEqual(new RespParser().push(Buffer.from("$4\r\nşğ\r\n")), ["şğ"], "UTF-8 bayt uzunluğu");
  assert.deepEqual(new RespParser().push(Buffer.from("*-1\r\n")), [null]);
  assert.throws(() => new RespParser().push(Buffer.from("?x\r\n")));
});

test("URL: parola, veritabanı, TLS; geçersiz null", () => {
  assert.deepEqual(parseRedisUrl("redis://:s%40r@r.test:6390/2"), { host: "r.test", port: 6390, tls: false, username: null, password: "s@r", db: 2 });
  assert.deepEqual(parseRedisUrl("rediss://u:p@r.test"), { host: "r.test", port: 6379, tls: true, username: "u", password: "p", db: 0 });
  for (const bad of ["", undefined, "http://x", "redis://", "redis://x/abc", "redis://x/-1"]) assert.equal(parseRedisUrl(bad), null, String(bad));
});

// --- Sahte RESP sunucusu: INCR/GET/PEXPIRE/DEL/PING/AUTH/SELECT (gerçek Redis değil; yalnızca istemci protokol doğrulaması)
const store = new Map<string, string>();
const seen: string[] = [];
const server = net.createServer((sock) => {
  const parser = new RespParser();
  sock.on("data", (chunk) => {
    for (const cmd of parser.push(chunk) as string[][]) {
      const [name, ...a] = cmd as string[];
      seen.push(`${name}`);
      switch (String(name).toUpperCase()) {
        case "PING": sock.write("+PONG\r\n"); break;
        case "AUTH": sock.write(a[0] === "gizli" ? "+OK\r\n" : "-WRONGPASS\r\n"); break;
        case "SELECT": sock.write("+OK\r\n"); break;
        case "INCR": { const n = Number(store.get(a[0]!) ?? 0) + 1; store.set(a[0]!, String(n)); sock.write(`:${n}\r\n`); break; }
        case "GET": { const v = store.get(a[0]!); sock.write(v === undefined ? "$-1\r\n" : `$${Buffer.byteLength(v)}\r\n${v}\r\n`); break; }
        case "PEXPIRE": sock.write(":1\r\n"); break;
        case "DEL": sock.write(`:${store.delete(a[0]!) ? 1 : 0}\r\n`); break;
        case "SLOW": break; // yanıt verme: zaman aşımı testi
        default: sock.write("-ERR bilinmeyen\r\n");
      }
    }
  });
});
await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
const port = (server.address() as net.AddressInfo).port;
after(() => server.close());

test("istemci: komutlar çalışır, sıralı yanıtlar karışmaz (paralel)", async () => {
  const c = new RedisClient({ host: "127.0.0.1", port, tls: false, username: null, password: null, db: 1 }, { timeoutMs: 400 });
  const results = await Promise.all([c.command(["INCR", "k"]), c.command(["INCR", "k"]), c.command(["INCR", "k"]), c.command(["GET", "k"]), c.command(["GET", "yok"])]);
  assert.deepEqual(results, [1, 2, 3, "3", null]);
  assert.equal(await c.command(["DEL", "k"]), 1);
  assert.ok(seen.includes("SELECT"), "db seçimi yapıldı");
  c.close();
});

test("istemci: yanlış parola ve hatalı komut fırlatmaz, undefined döner", async () => {
  const bad = new RedisClient({ host: "127.0.0.1", port, tls: false, username: null, password: "yanlis", db: 0 }, { timeoutMs: 300, backoffMs: 50 });
  assert.equal(await bad.command(["GET", "k"]), undefined);
  const good = new RedisClient({ host: "127.0.0.1", port, tls: false, username: null, password: "gizli", db: 0 }, { timeoutMs: 300 });
  assert.equal(await good.command(["PING"]), "PONG");
  assert.equal(await good.command(["BILINMEYEN"]), undefined, "Redis hata yanıtı yutulur");
  assert.equal(await good.command(["INCR", "z"]), 1, "hatadan sonra bağlantı kullanılabilir");
  good.close(); bad.close();
});

test("istemci: zaman aşımı undefined döner ve geri çekilme sonrası toparlanır; ulaşılamayan sunucu patlatmaz", async () => {
  const c = new RedisClient({ host: "127.0.0.1", port, tls: false, username: null, password: null, db: 0 }, { timeoutMs: 150, backoffMs: 80 });
  assert.equal(await c.command(["SLOW"]), undefined);
  assert.equal(await c.command(["PING"]), undefined, "geri çekilme süresinde denenmez");
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(await c.command(["PING"]), "PONG");
  c.close();
  const dead = new RedisClient({ host: "127.0.0.1", port: 1, tls: false, username: null, password: null, db: 0 }, { timeoutMs: 100, backoffMs: 20 });
  assert.equal(await dead.command(["PING"]), undefined);
  dead.close();
});
