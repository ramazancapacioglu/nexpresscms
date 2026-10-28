import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MediaAssetDto, TaxonomyDto } from "@nexpress/database";
import { buildTaxonomyTree, collectTaxonomyDescendantIds, flattenTaxonomyTree } from "@nexpress/core";
import { deleteTaxonomyAction, saveTaxonomyAction } from "@/app/admin/actions";

export interface TaxonomyStudioClientProps {
  initialTaxonomies: TaxonomyDto[];
  initialMediaAssets?: MediaAssetDto[];
}

/** TaxonomyStudioClient durum ve davranışları; JSX bölümleri bu nesneyi `s` olarak alır. */
export function useTaxonomyStudio({
  initialTaxonomies,
  initialMediaAssets = [],
}: TaxonomyStudioClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<TaxonomyDto[]>(initialTaxonomies);
  const [activeType, setActiveType] = useState<"category" | "tag">("category");
  const [searchQuery, setSearchQuery] = useState("");

  // Form Durumları (Yeni Ekleme veya Mevcut Düzenleme)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [color, setColor] = useState<string>("#2563eb");
  const [description, setDescription] = useState<string>("");
  const [seoTitle, setSeoTitle] = useState<string>("");
  const [seoDescription, setSeoDescription] = useState<string>("");

  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  React.useEffect(() => {
    setItems(initialTaxonomies);
  }, [initialTaxonomies]);

  const categories = useMemo(
    () => items.filter((t) => t.taxonomyType === "category"),
    [items]
  );
  const tags = useMemo(
    () => items.filter((t) => t.taxonomyType === "tag"),
    [items]
  );

  // Hiyerarşik Kategori Ağacı
  const flatCategoryTree = useMemo(
    () => flattenTaxonomyTree(buildTaxonomyTree(categories)),
    [categories]
  );

  // Düzenleme sırasında döngüsel ebeveyn seçilmesini engelle (kendisi ve alt kategorileri hariç)
  const forbiddenParentIds = useMemo(() => {
    if (!editingId) return new Set<string>();
    return new Set(collectTaxonomyDescendantIds(categories, editingId));
  }, [categories, editingId]);

  const displayedList = useMemo(() => {
    const source = activeType === "category" ? flatCategoryTree : tags.map((t) => ({ ...t, depth: 0, children: [] }));
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        x.slug.toLowerCase().includes(q) ||
        (x.description ?? "").toLowerCase().includes(q)
    );
  }, [activeType, flatCategoryTree, tags, searchQuery]);

  const resetForm = (defaultParentId = "") => {
    setEditingId(null);
    setName("");
    setSlug("");
    setParentId(defaultParentId);
    setImageUrl("");
    setSortOrder(items.length + 1);
    setColor(activeType === "category" ? "#2563eb" : "#09090b");
    setDescription("");
    setSeoTitle("");
    setSeoDescription("");
  };

  const handleStartEdit = (tax: TaxonomyDto) => {
    setActiveType(tax.taxonomyType as "category" | "tag");
    setEditingId(tax.id);
    setName(tax.name);
    setSlug(tax.slug);
    setParentId(tax.parentId ?? "");
    setImageUrl(tax.imageUrl ?? "");
    setSortOrder(tax.sortOrder ?? 1);
    setColor(tax.color ?? "#2563eb");
    setDescription(tax.description ?? "");
    setSeoTitle(tax.seoTitle ?? tax.name);
    setSeoDescription(tax.seoDescription ?? tax.description ?? "");
  };

  const handleStartAddChild = (parentTax: TaxonomyDto) => {
    setActiveType("category");
    resetForm(parentTax.id);
    showToast(`"${parentTax.name}" altına yeni alt kategori ekleniyor.`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalSlug =
      slug.trim() ||
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9ğüşıöç\s-]/g, "")
        .replace(/\s+/g, "-");

    startTransition(async () => {
      const res = await saveTaxonomyAction({
        id: editingId ?? undefined,
        taxonomyType: activeType,
        name: name.trim(),
        slug: finalSlug,
        parentId: activeType === "category" && parentId ? parentId : null,
        imageUrl: imageUrl.trim() || null,
        sortOrder: Number(sortOrder) || 0,
        color,
        description: description.trim() || undefined,
        seoTitle: seoTitle.trim() || name.trim(),
        seoDescription: seoDescription.trim() || description.trim() || undefined,
      });

      if (res.ok) {
        setItems((prev) => {
          const exists = prev.some((x) => x.id === res.taxonomy.id);
          if (exists) {
            return prev.map((x) =>
              x.id === res.taxonomy.id ? res.taxonomy : x
            );
          }
          return [...prev, res.taxonomy];
        });
        showToast(
          editingId
            ? `"${res.taxonomy.name}" güncellendi.`
            : `"${res.taxonomy.name}" ağaca eklendi.`
        );
        resetForm();
        router.refresh();
      }
    });
  };

  const handleDelete = (tax: TaxonomyDto) => {
    startTransition(async () => {
      const res = await deleteTaxonomyAction({ id: tax.id });
      if (res.ok) {
        setItems((prev) =>
          prev
            .filter((x) => x.id !== tax.id)
            .map((x) =>
              x.parentId === tax.id
                ? { ...x, parentId: tax.parentId ?? null }
                : x
            )
        );
        if (editingId === tax.id) resetForm();
        showToast(
          `"${tax.name}" silindi (varsa alt kategorileri bir üst seviyeye taşındı).`
        );
        router.refresh();
      }
    });
  };

  return { initialMediaAssets, initialTaxonomies, isPending, startTransition, items, setItems, activeType, setActiveType, searchQuery, setSearchQuery, editingId, setEditingId, name, setName, slug, setSlug, parentId, setParentId, imageUrl, setImageUrl, sortOrder, setSortOrder, color, setColor, description, setDescription, seoTitle, setSeoTitle, seoDescription, setSeoDescription, mediaModalOpen, setMediaModalOpen, toastMsg, setToastMsg, router, showToast, categories, tags, flatCategoryTree, forbiddenParentIds, displayedList, resetForm, handleStartEdit, handleStartAddChild, handleSave, handleDelete };
}

export type TaxonomyStudioState = ReturnType<typeof useTaxonomyStudio>;
