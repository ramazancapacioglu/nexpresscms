import { registerMarketplaceDriver } from "../registry";
import { amazonDriver } from "./amazon";
import { ciceksepetiDriver } from "./ciceksepeti";
import { hepsiburadaDriver } from "./hepsiburada";
import { n11Driver } from "./n11";
import { trendyolDriver } from "./trendyol";

let registered = false;

/** Yerleşik pazar yerlerini bir kez kaydeder. Ek sürücüler `registerMarketplaceDriver` ile eklenir. */
export function registerBuiltinMarketplaceDrivers(): void {
  if (registered) return;
  registered = true;
  for (const driver of [
    trendyolDriver,
    hepsiburadaDriver,
    n11Driver,
    amazonDriver,
    ciceksepetiDriver,
  ]) {
    registerMarketplaceDriver(driver);
  }
}
