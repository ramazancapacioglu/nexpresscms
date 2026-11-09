import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  resolveCommerceSettings,
  type CommerceOrderDto,
  type CommerceOrderItemDto,
  type CommerceOrderStatus,
  type CommerceProductDto,
  type CommerceSettings,
  type CreateCommerceOrderInput,
  type SaveCommerceProductInput,
} from "@nexpress/commerce";
import { getCmsContext, resolveSiteSettings } from "@nexpress/core";
import type { DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { mapOrder, mapOrderItem, mapProduct } from "./commerce-mappers";
import { backendFor } from "./dialect";

export class CommerceRepository {
  public readonly siteId: string;
  public readonly dialect: DbDialect;

  constructor(siteId?: string, dialect?: DbDialect) {
    const ctx = getCmsContext();
    this.siteId = siteId ?? ctx.siteId ?? "default";
    this.dialect = dialect ?? getDbDialect();
  }

  /** Motor başına tablo/istemci adaptörü (bkz. dialect.ts). */
  private get backend() {
    return backendFor(this.dialect);
  }

  private async readRawSiteSettings(): Promise<Record<string, unknown>> {
    const { db, t } = this.backend;
    const rows = await db
      .select({ settings: t.sites.settings })
      .from(t.sites)
      .where(eq(t.sites.siteId, this.siteId))
      .limit(1);
    const raw = rows[0]?.settings;
    return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  }

  private async writeRawSiteSettings(nextRaw: Record<string, unknown>): Promise<void> {
    const resolved = resolveSiteSettings(nextRaw);
    const merged = { ...nextRaw, ...resolved };
    const now = new Date();
    const { db, t } = this.backend;
    await db
      .update(t.sites)
      .set({ settings: merged as unknown as Record<string, unknown>, updatedAt: now })
      .where(eq(t.sites.siteId, this.siteId));
  }

  public async getCommerceSettings(): Promise<CommerceSettings> {
    const raw = await this.readRawSiteSettings();
    return resolveCommerceSettings(raw.commerce);
  }

  public async saveCommerceSettings(
    patch: Partial<CommerceSettings>
  ): Promise<CommerceSettings> {
    const raw = await this.readRawSiteSettings();
    const current = resolveCommerceSettings(raw.commerce);
    const next = { ...current, ...patch };
    await this.writeRawSiteSettings({ ...raw, commerce: next });
    return next;
  }

  public async listProducts(options?: {
    status?: CommerceProductDto["status"];
  }): Promise<CommerceProductDto[]> {
    const { db, t } = this.backend;
    const cond = options?.status
      ? and(
          eq(t.commerceProducts.siteId, this.siteId),
          eq(t.commerceProducts.status, options.status)
        )
      : eq(t.commerceProducts.siteId, this.siteId);
    const rows = await db
      .select()
      .from(t.commerceProducts)
      .where(cond)
      .orderBy(desc(t.commerceProducts.updatedAt));
    return rows.map(mapProduct);
  }

  public async getProductById(id: string): Promise<CommerceProductDto | null> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.commerceProducts)
      .where(
        and(eq(t.commerceProducts.siteId, this.siteId), eq(t.commerceProducts.id, id))
      )
      .limit(1);
    return rows[0] ? mapProduct(rows[0]) : null;
  }

  public async getProductBySlug(slug: string): Promise<CommerceProductDto | null> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.commerceProducts)
      .where(
        and(eq(t.commerceProducts.siteId, this.siteId), eq(t.commerceProducts.slug, slug))
      )
      .limit(1);
    return rows[0] ? mapProduct(rows[0]) : null;
  }

  public async getProductsByIds(ids: string[]): Promise<CommerceProductDto[]> {
    if (ids.length === 0) return [];
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.commerceProducts)
      .where(
        and(
          eq(t.commerceProducts.siteId, this.siteId),
          inArray(t.commerceProducts.id, ids)
        )
      );
    return rows.map(mapProduct);
  }

  public async saveProduct(input: SaveCommerceProductInput): Promise<CommerceProductDto> {
    const now = new Date();
    const id = input.id ?? randomUUID();
    const record = {
      id,
      siteId: this.siteId,
      contentId: input.contentId ?? null,
      sku: input.sku.trim(),
      slug: input.slug.trim(),
      name: input.name.trim(),
      shortDescription: input.shortDescription?.trim() ?? "",
      descriptionHtml: input.descriptionHtml ?? "",
      priceCents: input.priceCents,
      compareAtCents: input.compareAtCents ?? null,
      currency: input.currency ?? "TRY",
      stockQuantity: input.stockQuantity ?? 0,
      stockStatus: input.stockStatus ?? "instock",
      status: input.status ?? "draft",
      imageUrl: input.imageUrl ?? null,
      galleryUrls: input.galleryUrls ?? [],
      productKind: input.productKind ?? "simple",
      createdAt: now,
      updatedAt: now,
    };

    const { db, t } = this.backend;
    // Tek, atomik ve kiracıya kapalı upsert: başka kiracının aynı kimliği sessizce yazılmaz
    // (çakışırsa satır güncellenmez ve aşağıdaki okuma `null` döner → hata).
    const { id: _id, siteId: _siteId, createdAt: _createdAt, ...update } = record;
    await db
      .insert(t.commerceProducts)
      .values(record)
      .onConflictDoUpdate({
        target: t.commerceProducts.id,
        set: { ...update, updatedAt: now },
        setWhere: eq(t.commerceProducts.siteId, this.siteId),
      });
    const saved = await this.getProductById(id);
    if (!saved) throw new Error("Ürün kaydedilemedi.");
    return saved;
  }

  public async deleteProduct(id: string): Promise<void> {
    const { db, t } = this.backend;
    await db
      .delete(t.commerceProducts)
      .where(
        and(eq(t.commerceProducts.siteId, this.siteId), eq(t.commerceProducts.id, id))
      );
  }

  public async listOrders(limit = 50): Promise<CommerceOrderDto[]> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.commerceOrders)
      .where(eq(t.commerceOrders.siteId, this.siteId))
      .orderBy(desc(t.commerceOrders.createdAt))
      .limit(limit);
    return rows.map(mapOrder);
  }

  public async getOrderById(id: string): Promise<CommerceOrderDto | null> {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.commerceOrders)
      .where(and(eq(t.commerceOrders.siteId, this.siteId), eq(t.commerceOrders.id, id)))
      .limit(1);
    if (!rows[0]) return null;
    const items = await db
      .select()
      .from(t.commerceOrderItems)
      .where(
        and(
          eq(t.commerceOrderItems.siteId, this.siteId),
          eq(t.commerceOrderItems.orderId, id)
        )
      );
    return { ...mapOrder(rows[0]), items: items.map(mapOrderItem) };
  }

  public async updateOrderStatus(id: string, status: CommerceOrderStatus): Promise<void> {
    const now = new Date();
    const { db, t } = this.backend;
    await db
      .update(t.commerceOrders)
      .set({ status, updatedAt: now })
      .where(and(eq(t.commerceOrders.siteId, this.siteId), eq(t.commerceOrders.id, id)));
  }

  private async nextOrderNumber(): Promise<string> {
    const prefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `NX-${prefix}-${random}`;
  }

  public async createOrderFromCart(input: CreateCommerceOrderInput): Promise<CommerceOrderDto> {
    const settings = await this.getCommerceSettings();
    const productIds = input.lines.map((l) => l.productId);
    const products = await this.getProductsByIds(productIds);
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotalCents = 0;
    const itemRows: Omit<CommerceOrderItemDto, "siteId" | "orderId">[] = [];

    const stockHits: Array<{ productId: string; variantId?: string; quantity: number }> = [];

    for (const line of input.lines) {
      const product = byId.get(line.productId);
      if (!product || product.status !== "published") {
        throw new Error(`Ürün bulunamadı veya yayında değil: ${line.productId}`);
      }
      const qty = Math.min(Math.max(1, line.quantity), 99);
      const variant = line.variantId ? await this.getVariant(line.variantId) : null;
      if (line.variantId && (!variant || variant.productId !== product.id)) {
        throw new Error(`Varyasyon bulunamadı: ${line.variantId}`);
      }
      const unit = variant?.priceCents ?? product.priceCents;
      const sku = variant?.sku ?? product.sku;
      const title = variant ? `${product.name} · ${sku}` : product.name;
      const available = variant ? variant.stockQuantity : product.stockQuantity;
      if (!variant && product.stockStatus === "outofstock") {
        throw new Error(`Stokta yok: ${product.name}`);
      }
      if (available > 0 && qty > available) {
        throw new Error(`Yetersiz stok: ${title}`);
      }
      const lineTotal = unit * qty;
      subtotalCents += lineTotal;
      stockHits.push({ productId: product.id, variantId: variant?.id, quantity: qty });
      itemRows.push({
        id: randomUUID(),
        productId: product.id,
        sku,
        title,
        quantity: qty,
        unitPriceCents: unit,
        lineTotalCents: lineTotal,
      });
    }

    if (itemRows.length === 0) {
      throw new Error("Sepet boş.");
    }

    const discountCents = Math.min(subtotalCents, Math.max(0, input.discountCents ?? 0));
    const shippingCents =
      input.shippingCents ??
      (subtotalCents >= settings.freeShippingThresholdCents ? 0 : settings.flatShippingCents);
    const taxCents = 0;
    const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);

    const orderId = randomUUID();
    const now = new Date();
    const orderNumber = await this.nextOrderNumber();

    const orderRecord = {
      id: orderId,
      siteId: this.siteId,
      orderNumber,
      status: "pending" as const,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail.trim(),
      customerPhone: input.customerPhone?.trim() ?? null,
      shippingAddress: input.shippingAddress as unknown as Record<string, string>,
      billingAddress: (input.billingAddress as unknown as Record<string, string> | null) ?? null,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      currency: settings.currency,
      customerNote: input.customerNote?.trim() ?? null,
      source: "site" as const,
      channelId: null,
      customerId: input.customerId ?? null,
      couponCode: input.couponCode?.trim() || null,
      discountCents,
      shippingMethodId: input.shippingMethodId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const items = itemRows.map((item) => ({
      ...item,
      siteId: this.siteId,
      orderId,
    }));

    const { db, t } = this.backend;
    await db.insert(t.commerceOrders).values(orderRecord);
    await db.insert(t.commerceOrderItems).values(items);
    await this.applyStockHits(stockHits, now);
  

    const created = await this.getOrderById(orderId);
    if (!created) throw new Error("Sipariş oluşturulamadı.");
    return created;
  }

  private async getVariant(id: string) {
    const { db, t } = this.backend;
    const rows = await db
      .select()
      .from(t.commerceVariants)
      .where(and(eq(t.commerceVariants.siteId, this.siteId), eq(t.commerceVariants.id, id)))
      .limit(1);
    return rows[0] ?? null;
  }

  private async applyStockHits(
    hits: Array<{ productId: string; variantId?: string; quantity: number }>,
    now: Date
  ) {
    for (const hit of hits) {
      if (hit.variantId) {
        const variant = await this.getVariant(hit.variantId);
        if (!variant || variant.stockQuantity <= 0) continue;
        const next = Math.max(0, variant.stockQuantity - hit.quantity);
        const { db, t } = this.backend;
        await db
          .update(t.commerceVariants)
          .set({ stockQuantity: next })
          .where(eq(t.commerceVariants.id, hit.variantId));
      
        continue;
      }
      const product = await this.getProductById(hit.productId);
      if (!product || product.stockQuantity <= 0) continue;
      const next = Math.max(0, product.stockQuantity - hit.quantity);
      const { db, t } = this.backend;
      await db
        .update(t.commerceProducts)
        .set({ stockQuantity: next, updatedAt: now })
        .where(eq(t.commerceProducts.id, hit.productId));
    
    }
  }
}

export function getCommerceRepository(siteIdOverride?: string): CommerceRepository {
  return new CommerceRepository(siteIdOverride);
}
