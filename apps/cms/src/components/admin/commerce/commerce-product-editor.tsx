"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CommerceAttributeDto, CommerceCategoryDto, CommerceProductDto, CommerceVariantDto } from "@nexpress/commerce";
import { centsToInputValue } from "@nexpress/commerce";
import { saveVariantsAction } from "@/app/admin/commerce/catalog-actions";
import { saveCommerceProductAction } from "@/app/admin/commerce/actions";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

export function CommerceProductEditor({
  product,
  categories = [],
  attributes = [],
  variants = [],
  initialCategoryIds = [],
}: {
  product?: CommerceProductDto | null;
  categories?: CommerceCategoryDto[];
  attributes?: CommerceAttributeDto[];
  variants?: CommerceVariantDto[];
  initialCategoryIds?: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const [sku, setSku] = useState(product?.sku ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [descriptionHtml, setDescriptionHtml] = useState(product?.descriptionHtml ?? "");
  const [priceInput, setPriceInput] = useState(
    product ? centsToInputValue(product.priceCents) : "0,00"
  );
  const [compareAtInput, setCompareAtInput] = useState(
    product?.compareAtCents != null ? centsToInputValue(product.compareAtCents) : ""
  );
  const [stockQuantity, setStockQuantity] = useState(String(product?.stockQuantity ?? 0));
  const [stockStatus, setStockStatus] = useState(product?.stockStatus ?? "instock");
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [productKind, setProductKind] = useState(product?.productKind ?? "simple");
  const [categoryIds, setCategoryIds] = useState<string[]>(initialCategoryIds);

  const save = () => {
    start(async () => {
      const id = await saveCommerceProductAction({
        id: product?.id,
        sku,
        slug,
        name,
        shortDescription,
        descriptionHtml,
        priceInput,
        compareAtInput: compareAtInput || undefined,
        stockQuantity: Number.parseInt(stockQuantity, 10) || 0,
        stockStatus,
        status,
        imageUrl: imageUrl.trim() || null,
        contentId: product?.contentId ?? null,
        productKind,
        categoryIds,
      });
      setNotice("Ürün kaydedildi.");
      if (!product?.id) {
        router.replace(`/admin/commerce/products/${id}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="text-[18px] font-semibold">{product ? "Ürün düzenle" : "Yeni ürün"}</h1>
        <p className="text-[12px] text-[#8C9099]">Mağaza vitrininde görünen katalog kaydı.</p>
      </header>

      <div className="grid gap-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-[#8C9099]">Ad</span>
          <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-[#8C9099]">SKU</span>
            <input className={fieldClass} value={sku} onChange={(e) => setSku(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-[#8C9099]">Adres (slug)</span>
            <input className={fieldClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-[#8C9099]">Kısa açıklama</span>
          <textarea
            className={fieldClass}
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-[#8C9099]">Açıklama (HTML)</span>
          <textarea
            className={fieldClass}
            rows={4}
            value={descriptionHtml}
            onChange={(e) => setDescriptionHtml(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-[#8C9099]">Fiyat (TRY)</span>
            <input
              className={fieldClass}
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-[#8C9099]">Karşılaştırma fiyatı</span>
            <input
              className={fieldClass}
              value={compareAtInput}
              onChange={(e) => setCompareAtInput(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-[#8C9099]">Stok adedi</span>
            <input
              className={fieldClass}
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-[#8C9099]">Stok durumu</span>
            <select
              className={fieldClass}
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value as typeof stockStatus)}
            >
              <option value="instock">Stokta</option>
              <option value="outofstock">Tükendi</option>
              <option value="onbackorder">Ön sipariş</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-[#8C9099]">Yayın durumu</span>
            <select
              className={fieldClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="draft">Taslak</option>
              <option value="published">Yayında</option>
            </select>
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-[#8C9099]">Ürün tipi</span>
          <select
            className={fieldClass}
            value={productKind}
            onChange={(e) => setProductKind(e.target.value as typeof productKind)}
          >
            <option value="simple">Basit</option>
            <option value="variable">Varyasyonlu</option>
          </select>
        </label>
        {categories.length > 0 ? (
          <fieldset className="space-y-1">
            <legend className="text-[11px] font-medium text-[#8C9099]">Kategoriler</legend>
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={categoryIds.includes(category.id)}
                  onChange={(e) =>
                    setCategoryIds((prev) =>
                      e.target.checked ? [...prev, category.id] : prev.filter((id) => id !== category.id)
                    )
                  }
                />
                {category.name}
              </label>
            ))}
          </fieldset>
        ) : null}
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-[#8C9099]">Görsel URL</span>
          <input className={fieldClass} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </label>
      </div>

      {product?.id && productKind === "variable" ? (
        <VariantWizard
          baseSku={sku}
          priceInput={priceInput}
          attributes={attributes}
          existing={variants}
          pending={pending}
          onSave={(next) =>
            start(async () => {
              await saveVariantsAction({ productId: product.id, variants: next });
              setNotice("Varyasyonlar kaydedildi.");
              router.refresh();
            })
          }
        />
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-md bg-[#111318] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50 dark:bg-white dark:text-[#111318]"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {notice ? <span className="text-[12px] text-emerald-600">{notice}</span> : null}
      </div>
    </div>
  );
}

function VariantWizard({
  baseSku,
  priceInput,
  attributes,
  existing,
  pending,
  onSave,
}: {
  baseSku: string;
  priceInput: string;
  attributes: CommerceAttributeDto[];
  existing: CommerceVariantDto[];
  pending: boolean;
  onSave: (rows: Array<{ sku: string; priceInput: string; stockQuantity: number; valueIds: string[] }>) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [rows, setRows] = useState(
    existing.map((variant) => ({
      sku: variant.sku,
      priceInput: centsToInputValue(variant.priceCents),
      stockQuantity: variant.stockQuantity,
      valueIds: variant.valueIds,
      label: variant.sku,
    }))
  );

  const generate = () => {
    const selected = attributes.filter((attr) => picked.includes(attr.id) && attr.values.length > 0);
    if (selected.length === 0) return;
    let combos: Array<Array<{ id: string; label: string }>> = [[]];
    for (const attr of selected) {
      combos = combos.flatMap((combo) => attr.values.map((value) => [...combo, { id: value.id, label: value.label }]));
    }
    setRows(
      combos.map((combo) => ({
        sku: `${baseSku}-${combo.map((item) => item.label).join("-")}`.toLowerCase().replace(/\s+/g, "-"),
        priceInput,
        stockQuantity: 0,
        valueIds: combo.map((item) => item.id),
        label: combo.map((item) => item.label).join(" / "),
      }))
    );
  };

  return (
    <section className="space-y-3 rounded-lg border border-[#E6E7EA] p-4 dark:border-[#23262E]">
      <h2 className="text-[13px] font-semibold">Varyasyon sihirbazı</h2>
      <div className="flex flex-wrap gap-3">
        {attributes.map((attr) => (
          <label key={attr.id} className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={picked.includes(attr.id)}
              onChange={(e) =>
                setPicked((prev) => (e.target.checked ? [...prev, attr.id] : prev.filter((id) => id !== attr.id)))
              }
            />
            {attr.name}
          </label>
        ))}
      </div>
      <button type="button" className="text-[12px] underline" onClick={generate}>
        Kombinasyon üret
      </button>
      {rows.length > 0 ? (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={`${row.sku}-${index}`} className="grid gap-2 sm:grid-cols-4 text-[12px]">
              <span className="self-center">{row.label}</span>
              <input
                className={fieldClass}
                value={row.sku}
                onChange={(e) =>
                  setRows((prev) => prev.map((item, i) => (i === index ? { ...item, sku: e.target.value } : item)))
                }
              />
              <input
                className={fieldClass}
                value={row.priceInput}
                onChange={(e) =>
                  setRows((prev) => prev.map((item, i) => (i === index ? { ...item, priceInput: e.target.value } : item)))
                }
              />
              <input
                className={fieldClass}
                type="number"
                value={row.stockQuantity}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, stockQuantity: Number(e.target.value) } : item
                    )
                  )
                }
              />
            </div>
          ))}
          <button
            type="button"
            disabled={pending}
            className="rounded-md border border-[#E6E7EA] px-3 py-2 text-[12px] dark:border-[#23262E]"
            onClick={() => onSave(rows)}
          >
            Varyasyonları kaydet
          </button>
        </div>
      ) : (
        <p className="text-[12px] text-[#8C9099]">Önce nitelik değerleri tanımlayın, sonra kombinasyon üretin.</p>
      )}
    </section>
  );
}
