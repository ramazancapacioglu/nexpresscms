/**
 * `unstable_cache` değerleri JSON'a çevirir; `Date` alanları dizeye dönüşür.
 * Bu çift, tarihleri işaretleyerek gidiş-dönüşte `Date` olarak korur.
 */
const DATE_TAG = "$nxDate";

export function stringifyWithDates(value: unknown): string {
  return JSON.stringify(value, function (this: Record<string, unknown>, key: string, val: unknown) {
    // JSON.stringify, toJSON'u çağırdıktan sonra değeri verir; ham değere `this[key]` ile ulaşılır.
    const raw = this[key];
    return raw instanceof Date ? { [DATE_TAG]: raw.getTime() } : val;
  });
}

export function parseWithDates<T>(text: string): T {
  return JSON.parse(text, (_key, val: unknown) => {
    if (val && typeof val === "object" && DATE_TAG in (val as object)) {
      return new Date((val as Record<string, number>)[DATE_TAG] as number);
    }
    return val;
  }) as T;
}
