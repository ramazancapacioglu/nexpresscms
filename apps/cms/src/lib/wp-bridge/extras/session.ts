import "server-only";

/**
 * Yönetici oturumlu, salt-okunur WordPress istemcisi. Yalnızca verilen kök adrese gider, yalnızca GET yapar (giriş hariç).
 * Parola ve çerez diske yazılmaz; betik süreci bitince gider.
 */
export interface WpSession {
  origin: string;
  text(path: string): Promise<string>;
  json<T>(path: string): Promise<T>;
}

function cookieHeader(jar: Map<string, string>): string {
  return [...jar].map(([key, value]) => `${key}=${value}`).join("; ");
}

function remember(jar: Map<string, string>, res: Response): void {
  for (const line of res.headers.getSetCookie()) {
    const pair = line.split(";")[0] ?? "";
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

export async function openWpSession(originRaw: string, user: string, password: string): Promise<WpSession> {
  const origin = new URL(originRaw).origin;
  if (!origin.startsWith("https://")) throw new Error("Kök adres https olmalı.");
  const jar = new Map<string, string>([["wordpress_test_cookie", "WP%20Cookie%20check"]]);
  const headers = { "user-agent": "NexPress-Importer/1.0", cookie: "" };
  const body = new URLSearchParams({ log: user, pwd: password, "wp-submit": "Giriş Yap", redirect_to: `${origin}/wp-admin/`, testcookie: "1" });
  headers.cookie = cookieHeader(jar);
  const login = await fetch(`${origin}/wp-login.php`, { method: "POST", body, headers: { ...headers, "content-type": "application/x-www-form-urlencoded" }, redirect: "manual" });
  remember(jar, login);
  if (![...jar.keys()].some((key) => key.startsWith("wordpress_logged_in"))) throw new Error("WordPress girişi başarısız.");
  const nonceRes = await fetch(`${origin}/wp-admin/admin-ajax.php?action=rest-nonce`, { headers: { ...headers, cookie: cookieHeader(jar) } });
  const nonce = (await nonceRes.text()).trim();
  const call = async (path: string): Promise<Response> => {
    const url = path.startsWith("http") ? path : `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
    if (new URL(url).origin !== origin) throw new Error("Yalnızca kaynak site okunur.");
    return fetch(url, { headers: { "user-agent": headers["user-agent"], cookie: cookieHeader(jar), "x-wp-nonce": nonce }, redirect: "follow", signal: AbortSignal.timeout(60_000) });
  };
  return {
    origin,
    async text(path) {
      const res = await call(path);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
      return res.text();
    },
    async json<T>(path: string) {
      const res = await call(path);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
      return (await res.json()) as T;
    },
  };
}

/** Sayfalı REST koleksiyonu. */
export async function wpAll<T>(session: WpSession, restPath: string, perPage = 50): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= 60; page += 1) {
    const join = restPath.includes("?") ? "&" : "?";
    let rows: T[];
    try {
      rows = await session.json<T[]>(`/wp-json/wp/v2/${restPath}${join}per_page=${perPage}&page=${page}`);
    } catch (error) {
      if (page > 1 && /HTTP 400/.test(String(error))) break;
      throw error;
    }
    if (!Array.isArray(rows) || rows.length === 0) break;
    out.push(...rows);
    if (rows.length < perPage) break;
  }
  return out;
}
