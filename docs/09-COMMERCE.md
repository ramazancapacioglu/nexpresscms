# 09 — E-Ticaret Modülü (`@nexpress/commerce`)

Çekirdek açık kaynak paket; ürün kataloğu, sepet (HTTP-only çerez), sipariş kaydı ve `/admin/commerce` yönetim paneli.

## Paketler ve tablolar

| Katman | Konum |
| :--- | :--- |
| Tipler, para birimi, sepet çerezi | `packages/commerce` |
| Drizzle şema + `CommerceRepository` | `packages/database` (`commerce_products`, `commerce_orders`, `commerce_order_items`) |
| Admin UI + ön yüz mağaza | `apps/cms` |

Tüm tablolarda `siteId` zorunludur; sorgular `getCommerceRepository(siteId)` üzerinden yapılır.

## Site ayarları

Mağaza ayarları `sites.settings.commerce` JSON alanında tutulur (`CommerceSettings`):

- `enabled`, `currency`, `shopBasePath` (varsayılan `magaza`)
- `flatShippingCents`, `freeShippingThresholdCents`
- `allowGuestCheckout`, `checkoutNotificationEmail` (bildirim — sonraki faz)

## Ön yüz (RSC)

Varsayılan rota ağacı (`shopBasePath = magaza`):

- `/{locale}/magaza` — vitrin
- `/{locale}/magaza/[slug]` — ürün detay (form ile sepete ekleme, ekstra client bundle yok)
- `/{locale}/magaza/sepet` — sepet
- `/{locale}/magaza/odeme` — misafir checkout (kapıda ödeme simülasyonu)
- `/{locale}/magaza/tesekkurler?no=…` — onay

Sepet: `nx_cart_v1` çerezi, `@nexpress/commerce/cart` yardımcıları.

## Admin

- `/admin/commerce` alt menüsü: özet, ürünler, siparişler, iade ve değişim, müşteriler, kategoriler, nitelikler, kampanyalar, kargo, pazar yerleri.
- Sipariş listesinde kaynak filtresi site veya pazar yeridir. İade/değişim kaydı aynı kaynağı taşır.
- Müşteri `source` alanı site veya pazar yeridir. Grup, sadakat defteri ve kişiye ya da gruba bağlı kupon buradan yönetilir.
- Varyasyonlu üründe nitelik kombinasyonu sihirbazı `commerce_variants` yazar. Ödeme adımı kupon ve seçili kargo yöntemini uygular.

Server action'lar: `apps/cms/src/app/admin/commerce/actions.ts` ve `catalog-actions.ts`.

## İçerik entegrasyonu

`contents.type = product` sayfaları SEO/Entity Graph için kullanılmaya devam eder. Katalog satırı isteğe bağlı `contentId` ile bağlanır (`seed`: `prod_nx_cloud` → `cnt_product_cloud`).

Bloklar `product_embed` / `product_row` tema katmanında kalır; mağaza vitrini ayrı katalog tablosundan beslenir.

## Kurulum

```bash
pnpm install
pnpm db:push    # packages/database
pnpm db:seed    # örnek ürünler
```

## Sonraki faz (Pro / genişletme)

Ödeme ağ geçitleri ve vergi bölgeleri sonraki fazdadır. Pazar yeri kanalları: `docs/10-MARKETPLACES.md`.
