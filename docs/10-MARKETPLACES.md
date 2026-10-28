# 10 — Pazar Yeri Entegrasyonu (`@nexpress/marketplace`)

Modüler kanal katmanı. Yeni bir pazar yeri, çekirdek ekranı değiştirmeden `registerMarketplaceDriver()` ile eklenir. Yerleşik sürücüler: Trendyol, Hepsiburada, n11, Amazon, Çiçeksepeti.

## Sözleşme

Her sürücü (`MarketplaceDriver`) şunları bildirir:

- kimlik alanları (`credentialFields`) — admin formu buradan üretilir
- yetenekler: bağlantı testi, stok/fiyat itme, sipariş çekme
- üç işlem: `testConnection`, `pushPriceStock`, `pullOrders`

Ortak stok kalemi yerel katalog SKU’sudur (`commerce_products.sku`). Fiyat ana birimdedir (kuruş değil).

Kayıt:

```ts
import { registerMarketplaceDriver } from "@nexpress/marketplace";
registerBuiltinMarketplaceDrivers(); // yerleşikler
registerMarketplaceDriver(myDriver);  // altıncı, yedinci…
```

Yerleşikler `apps/cms` admin sayfası ve server action açılışında bir kez kaydolur.

## Pazar farkları

| Pazar | Kimlik | Stok / fiyat | Sipariş |
| :--- | :--- | :--- | :--- |
| Trendyol | Basic (`apiKey:apiSecret`) + `User-Agent: {sellerId} - {ad}` | `POST /integration/inventory/sellers/{sellerId}/products/price-and-inventory` (barkod = SKU, en fazla 1000) | `GET …/integration/order/sellers/{sellerId}/v2/orders` |
| Hepsiburada | Basic + `User-Agent`, `merchantId` | Listing `inventory-uploads` ve `price-uploads` ayrı | OMS `GET /orders/merchantid/{merchantId}` |
| n11 | Header `appkey` / `appsecret` (SOAP ürün stok servisleri kapalı) | `POST /ms/product/tasks/price-stock-update` | `GET /rest/delivery/v1/shipmentPackages` |
| Amazon | LWA refresh token → `x-amz-access-token` | Listings Items `PATCH` (ürün tipi `PRODUCT`; reddedilirse yanıt iş günlüğüne düşer) | Orders API `GET /orders/v0/orders` |
| Çiçeksepeti | `x-api-key` + `User-Agent` satıcı ID | `PUT /api/v1/Products/price-and-stock` | `POST /api/v1/Order/GetOrders` |

Test ve canlı taban adresleri sürücü içindedir. n11’in ayrı sandbox host’u yoktur; test/canlı aynı `api.n11.com` anahtarıyla ayrılır.

## Veri

`siteId` kapsamlı tablolar:

- `marketplace_channels` — sürücü, etiket, ortam, kimlik JSON, son bağlantı durumu
- `marketplace_jobs` — test / stok / sipariş denemeleri
- `marketplace_orders` — çekilen dış siparişler (yerel `commerce_orders` kaydına otomatik dönüşmez)

Gizli alanlar güncellemede boş gönderilirse önceki değer korunur. Liste ekranına ham sır sızmaz.

## Admin

- `/admin/commerce/marketplaces` — sürücü kartları ve kanal oluşturma
- `/admin/commerce/marketplaces/[id]` — kimlik, bağlantı testi, katalog stok/fiyat gönderimi, son 14 gün sipariş çekimi

## Sınır

Kargo etiketi, fatura, kategori eşlemesi, iade ve webhook alıcıları bu sürümde yok. Aynı sürücüden birden fazla kanal (iki Trendyol satıcısı) açılabilir.
