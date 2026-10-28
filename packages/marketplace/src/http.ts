export async function marketplaceRequest(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ status: number; text: string; json: unknown }> {
  const { timeoutMs = 15000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...rest, signal: controller.signal });
    const text = await response.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { status: response.status, text, json };
  } finally {
    clearTimeout(timer);
  }
}

export function basicAuth(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

export function requireFields(
  credentials: Record<string, string>,
  keys: string[]
): string | null {
  for (const key of keys) {
    if (!credentials[key]?.trim()) return `${key} zorunlu.`;
  }
  return null;
}

export function fail(message: string): { ok: false; message: string } {
  return { ok: false, message };
}
