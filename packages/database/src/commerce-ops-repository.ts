import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type {
  CommerceAttributeDto,
  CommerceCampaignDto,
  CommerceCategoryDto,
  CommerceCouponDto,
  CommerceCustomerDto,
  CommerceCustomerGroupDto,
  CommerceCustomerSource,
  CommerceDiscountType,
  CommerceLoyaltyEntryDto,
  CommerceReturnDto,
  CommerceReturnKind,
  CommerceReturnStatus,
  CommerceShippingMethodDto,
  CommerceVariantDto,
} from "@nexpress/commerce";
import { getCmsContext, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { evaluateCouponQuote } from "./commerce-mappers";
import { backendFor, upsertScoped } from "./dialect";

export class CommerceOpsRepository {
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

  public async listCategories(): Promise<CommerceCategoryDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.commerceCategories).where(eq(t.commerceCategories.siteId, this.siteId));
    return rows.map((row) => ({ id: row.id, parentId: row.parentId, name: row.name, slug: row.slug, sortOrder: row.sortOrder }));
  }

  public async saveCategory(input: { id?: string; parentId?: string | null; name: string; slug: string; sortOrder?: number }) {
    const id = input.id ?? randomUUID();
    const record = {
      id,
      siteId: this.siteId,
      parentId: input.parentId || null,
      name: input.name.trim(),
      slug: input.slug.trim(),
      sortOrder: input.sortOrder ?? 0,
    };
    const { db, t } = this.backend;
    await upsertScoped(db, t.commerceCategories, this.siteId, record);
    return id;
  }

  public async deleteCategory(id: string) {
    const { db, t } = this.backend;
    await db.delete(t.commerceCategories).where(and(eq(t.commerceCategories.siteId, this.siteId), eq(t.commerceCategories.id, id)));
  }

  public async listAttributes(): Promise<CommerceAttributeDto[]> {
    const { db, t } = this.backend;
    const attrs = await db.select().from(t.commerceAttributes).where(eq(t.commerceAttributes.siteId, this.siteId));
    const values = await db.select().from(t.commerceAttributeValues).where(eq(t.commerceAttributeValues.siteId, this.siteId));
    return attrs.map((attr) => ({
      id: attr.id,
      name: attr.name,
      slug: attr.slug,
      values: values
        .filter((value) => value.attributeId === attr.id)
        .map((value) => ({ id: value.id, attributeId: value.attributeId, label: value.label, sortOrder: value.sortOrder })),
    }));
  }

  public async saveAttribute(input: { id?: string; name: string; slug: string; labels: string[] }) {
    const id = input.id ?? randomUUID();
    const record = { id, siteId: this.siteId, name: input.name.trim(), slug: input.slug.trim() };
    const { db, t } = this.backend;
    await upsertScoped(db, t.commerceAttributes, this.siteId, record);
    await db
      .delete(t.commerceAttributeValues)
      .where(and(eq(t.commerceAttributeValues.siteId, this.siteId), eq(t.commerceAttributeValues.attributeId, id)));
    for (const [index, label] of input.labels.entries()) {
      if (!label.trim()) continue;
      await db.insert(t.commerceAttributeValues).values({
        id: randomUUID(),
        siteId: this.siteId,
        attributeId: id,
        label: label.trim(),
        sortOrder: index,
      });
    }
    return id;
  }

  public async listVariants(productId: string): Promise<CommerceVariantDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.commerceVariants).where(and(eq(t.commerceVariants.siteId, this.siteId), eq(t.commerceVariants.productId, productId)));
    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      sku: row.sku,
      priceCents: row.priceCents,
      compareAtCents: row.compareAtCents,
      stockQuantity: row.stockQuantity,
      valueIds: row.valueIds ?? [],
      imageUrl: row.imageUrl,
    }));
  }

  public async replaceVariants(productId: string, variants: Array<Omit<CommerceVariantDto, "id" | "productId"> & { id?: string }>) {
    const { db, t } = this.backend;
    await db.delete(t.commerceVariants).where(and(eq(t.commerceVariants.siteId, this.siteId), eq(t.commerceVariants.productId, productId)));
    for (const variant of variants) {
      await db.insert(t.commerceVariants).values({
        id: variant.id ?? randomUUID(),
        siteId: this.siteId,
        productId,
        sku: variant.sku,
        priceCents: variant.priceCents,
        compareAtCents: variant.compareAtCents,
        stockQuantity: variant.stockQuantity,
        valueIds: variant.valueIds,
        imageUrl: variant.imageUrl,
      });
    }}

  public async productCategoryIds(productId: string): Promise<string[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.commerceProductCategories).where(and(eq(t.commerceProductCategories.siteId, this.siteId), eq(t.commerceProductCategories.productId, productId)));
    return rows.map((row) => row.categoryId);
  }

  public async setProductCategories(productId: string, categoryIds: string[]) {
    const { db, t } = this.backend;
    await db.delete(t.commerceProductCategories).where(and(eq(t.commerceProductCategories.siteId, this.siteId), eq(t.commerceProductCategories.productId, productId)));
    for (const categoryId of categoryIds) {
      await db.insert(t.commerceProductCategories).values({ id: randomUUID(), siteId: this.siteId, productId, categoryId });
    }}

  public async listGroups(): Promise<CommerceCustomerGroupDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.commerceCustomerGroups).where(eq(t.commerceCustomerGroups.siteId, this.siteId));
    return rows.map((row) => ({ id: row.id, name: row.name, description: row.description }));
  }

  public async saveGroup(input: { id?: string; name: string; description?: string }) {
    const id = input.id ?? randomUUID();
    const record = { id, siteId: this.siteId, name: input.name.trim(), description: input.description?.trim() ?? "" };
    const { db, t } = this.backend;
    await upsertScoped(db, t.commerceCustomerGroups, this.siteId, record);
    return id;
  }

  public async listCustomers(source?: CommerceCustomerSource): Promise<CommerceCustomerDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.commerceCustomers).where(eq(t.commerceCustomers.siteId, this.siteId)).orderBy(desc(t.commerceCustomers.createdAt));
    return rows
      .filter((row) => !source || row.source === source)
      .map((row) => ({
        id: row.id,
        source: row.source === "marketplace" ? "marketplace" : "site",
        channelId: row.channelId,
        externalKey: row.externalKey,
        name: row.name,
        email: row.email,
        phone: row.phone,
        groupId: row.groupId,
        loyaltyPoints: row.loyaltyPoints,
        createdAt: row.createdAt,
      }));
  }

  public async getCustomer(id: string): Promise<CommerceCustomerDto | null> {
    const rows = await this.listCustomers();
    return rows.find((row) => row.id === id) ?? null;
  }

  public async saveCustomer(input: {
    id?: string;
    source: CommerceCustomerSource;
    channelId?: string | null;
    externalKey?: string | null;
    name: string;
    email?: string;
    phone?: string | null;
    groupId?: string | null;
  }) {
    const now = new Date();
    const existing = input.id ? await this.getCustomer(input.id) : null;
    const id = existing?.id ?? input.id ?? randomUUID();
    const record = {
      id,
      siteId: this.siteId,
      source: input.source,
      channelId: input.channelId ?? null,
      externalKey: input.externalKey ?? null,
      name: input.name.trim(),
      email: input.email?.trim() ?? "",
      phone: input.phone ?? null,
      groupId: input.groupId ?? null,
      loyaltyPoints: existing?.loyaltyPoints ?? 0,
      createdAt: existing?.createdAt ?? now,
    };
    const { db, t } = this.backend;
    await upsertScoped(db, t.commerceCustomers, this.siteId, record, { name: record.name, email: record.email, phone: record.phone, groupId: record.groupId, source: record.source });
    return id;
  }

  public async upsertCustomer(input: {
    source: CommerceCustomerSource;
    channelId?: string | null;
    externalKey?: string | null;
    name: string;
    email?: string;
    phone?: string | null;
    loyaltyPoints?: number;
    loyaltyReason?: string;
  }) {
    const customers = await this.listCustomers(input.source);
    const found = customers.find((row) =>
      input.externalKey
        ? row.externalKey === input.externalKey && row.channelId === (input.channelId ?? null)
        : input.email && row.email.toLowerCase() === input.email.toLowerCase()
    );
    const id = await this.saveCustomer({
      id: found?.id,
      source: input.source,
      channelId: input.channelId,
      externalKey: input.externalKey,
      name: input.name,
      email: input.email,
      phone: input.phone,
      groupId: found?.groupId ?? null,
    });
    if (input.loyaltyPoints) await this.addLoyalty(id, input.loyaltyPoints, input.loyaltyReason ?? "Sipariş");
    return id;
  }

  public async addLoyalty(customerId: string, points: number, reason: string) {
    const customer = await this.getCustomer(customerId);
    if (!customer) return;
    const next = customer.loyaltyPoints + points;
    const { db, t } = this.backend;
    await db.update(t.commerceCustomers).set({ loyaltyPoints: next }).where(eq(t.commerceCustomers.id, customerId));
    await db.insert(t.commerceLoyaltyEntries).values({
      id: randomUUID(),
      siteId: this.siteId,
      customerId,
      points,
      reason,
      createdAt: new Date(),
    });
  }

  public async listLoyalty(customerId: string): Promise<CommerceLoyaltyEntryDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.commerceLoyaltyEntries).where(and(eq(t.commerceLoyaltyEntries.siteId, this.siteId), eq(t.commerceLoyaltyEntries.customerId, customerId))).orderBy(desc(t.commerceLoyaltyEntries.createdAt));
    return rows.map((row) => ({ id: row.id, customerId: row.customerId, points: row.points, reason: row.reason, createdAt: row.createdAt }));
  }

  public async listCampaigns(): Promise<CommerceCampaignDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.commerceCampaigns).where(eq(t.commerceCampaigns.siteId, this.siteId));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      discountType: row.discountType as CommerceDiscountType,
      value: row.value,
      audience: row.audience as CommerceCampaignDto["audience"],
      groupId: row.groupId,
      customerId: row.customerId,
      active: row.active,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
    }));
  }

  public async saveCampaign(input: Omit<CommerceCampaignDto, "id"> & { id?: string }) {
    const id = input.id ?? randomUUID();
    const record = { ...input, id, siteId: this.siteId, name: input.name.trim() };
    const { db, t } = this.backend;
    await upsertScoped(db, t.commerceCampaigns, this.siteId, record);
    return id;
  }

  public async listCoupons(): Promise<CommerceCouponDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.commerceCoupons).where(eq(t.commerceCoupons.siteId, this.siteId));
    return rows.map((row) => ({
      id: row.id,
      campaignId: row.campaignId,
      code: row.code,
      discountType: row.discountType as CommerceDiscountType,
      value: row.value,
      customerId: row.customerId,
      groupId: row.groupId,
      usageLimit: row.usageLimit,
      usedCount: row.usedCount,
      active: row.active,
    }));
  }

  public async saveCoupon(input: Omit<CommerceCouponDto, "id" | "usedCount"> & { id?: string }) {
    const id = input.id ?? randomUUID();
    const existing = (await this.listCoupons()).find((row) => row.id === id);
    const record = {
      id,
      siteId: this.siteId,
      campaignId: input.campaignId,
      code: input.code.trim().toUpperCase(),
      discountType: input.discountType,
      value: input.value,
      customerId: input.customerId,
      groupId: input.groupId,
      usageLimit: input.usageLimit,
      usedCount: existing?.usedCount ?? 0,
      active: input.active,
    };
    const { db, t } = this.backend;
    await upsertScoped(db, t.commerceCoupons, this.siteId, record);
    return id;
  }

  public async quoteCoupon(code: string, subtotalCents: number, customerId?: string | null) {
    const coupon = (await this.listCoupons()).find((row) => row.active && row.code === code.trim().toUpperCase()) ?? null;
    const customer = coupon?.groupId && customerId ? await this.getCustomer(customerId) : null;
    return evaluateCouponQuote(coupon, subtotalCents, customerId, customer?.groupId ?? null);
  }

  public async consumeCoupon(code: string) {
    const coupon = (await this.listCoupons()).find((row) => row.code === code.trim().toUpperCase());
    if (!coupon) return;
    const { db, t } = this.backend;
    await db.update(t.commerceCoupons).set({ usedCount: coupon.usedCount + 1 }).where(eq(t.commerceCoupons.id, coupon.id));
  }

  public async listReturns(): Promise<CommerceReturnDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.commerceReturns).where(eq(t.commerceReturns.siteId, this.siteId)).orderBy(desc(t.commerceReturns.createdAt));
    return rows.map((row) => ({
      id: row.id,
      source: row.source === "marketplace" ? "marketplace" : "site",
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      kind: row.kind as CommerceReturnKind,
      status: row.status as CommerceReturnStatus,
      reason: row.reason,
      note: row.note,
      createdAt: row.createdAt,
    }));
  }

  public async saveReturn(input: Omit<CommerceReturnDto, "id" | "createdAt">) {
    const record = { ...input, id: randomUUID(), siteId: this.siteId, createdAt: new Date() };
    const { db, t } = this.backend;
    await db.insert(t.commerceReturns).values(record);
  
    return record.id;
  }

  public async updateReturnStatus(id: string, status: CommerceReturnStatus) {
    const { db, t } = this.backend;
    await db.update(t.commerceReturns).set({ status }).where(and(eq(t.commerceReturns.siteId, this.siteId), eq(t.commerceReturns.id, id)));
  }

  public async listShipping(): Promise<CommerceShippingMethodDto[]> {
    const { db, t } = this.backend;
    const rows = await db.select().from(t.commerceShippingMethods).where(eq(t.commerceShippingMethods.siteId, this.siteId));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      carrier: row.carrier,
      flatRateCents: row.flatRateCents,
      freeThresholdCents: row.freeThresholdCents,
      enabled: row.enabled,
    }));
  }

  public async saveShipping(input: Omit<CommerceShippingMethodDto, "id"> & { id?: string }) {
    const id = input.id ?? randomUUID();
    const record = { ...input, id, siteId: this.siteId, name: input.name.trim() };
    const { db, t } = this.backend;
    await upsertScoped(db, t.commerceShippingMethods, this.siteId, record);
    return id;
  }
}

export function getCommerceOpsRepository(siteIdOverride?: string): CommerceOpsRepository {
  return new CommerceOpsRepository(siteIdOverride);
}
