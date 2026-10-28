import type { MarketplaceDriver } from "./types";

const drivers = new Map<string, MarketplaceDriver>();

/** Yeni bir pazar yeri sürücüsü kaydeder. Aynı `id` öncekini değiştirir. */
export function registerMarketplaceDriver(driver: MarketplaceDriver): void {
  drivers.set(driver.id, driver);
}

export function listMarketplaceDrivers(): MarketplaceDriver[] {
  return [...drivers.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function getMarketplaceDriver(id: string): MarketplaceDriver | null {
  return drivers.get(id) ?? null;
}
