import type { CommerceSettings } from "./types";

export const DEFAULT_COMMERCE_SETTINGS: CommerceSettings = {
  enabled: true,
  currency: "TRY",
  shopBasePath: "magaza",
  flatShippingCents: 9900,
  freeShippingThresholdCents: 150000,
  checkoutNotificationEmail: "",
  allowGuestCheckout: true,
};

export function resolveCommerceSettings(raw: unknown): CommerceSettings {
  const p = raw && typeof raw === "object" ? (raw as Partial<CommerceSettings>) : {};
  return { ...DEFAULT_COMMERCE_SETTINGS, ...p };
}
