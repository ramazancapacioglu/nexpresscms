import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContentDto, TaxonomyDto } from "@nexpress/database";
import { buildTaxonomyTree, flattenTaxonomyTree, resolvePublishing, type ContentStatus } from "@nexpress/core";
import { bulkContentAction, duplicateContentAction, patchContentAction } from "@/app/admin/actions";

export interface ContentListClientProps {
  mode: "page" | "post";
  items: ContentDto[];
  taxonomies: TaxonomyDto[];
}

/** ContentListClient durum ve davranışları; JSX bölümleri bu nesneyi `s` olarak alır. */
export function useContentList({
  mode,
  items: initialItems,
  taxonomies,
}: ContentListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<ContentDto[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContentStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Çoklu seçim (Bulk Edit)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategorySlug, setBulkCategorySlug] = useState<string>("");
  const [bulkTagSlug, setBulkTagSlug] = useState<string>("");

  // Satır İçi Hızlı Düzenleme (Quick Edit)
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [qeTitle, setQeTitle] = useState("");
  const [qeSlug, setQeSlug] = useState("");
  const [qeStatus, setQeStatus] = useState<ContentStatus>("published");
  const [qeVisibility, setQeVisibility] = useState<
    "public" | "private" | "password" | "members_only"
  >("public");
  const [qeImportance, setQeImportance] = useState<number>(8);
  const [qeNoIndex, setQeNoIndex] = useState<boolean>(false);
  const [qeTldr, setQeTldr] = useState<string>("");
  const [qeCategories, setQeCategories] = useState<string[]>([]);
  const [qeTags, setQeTags] = useState<string[]>([]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Senkronizasyon
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const categories = useMemo(
    () => taxonomies.filter((t) => t.taxonomyType === "category"),
    [taxonomies]
  );
  const tags = useMemo(
    () => taxonomies.filter((t) => t.taxonomyType === "tag"),
    [taxonomies]
  );

  const flatCategoryTree = useMemo(
    () => flattenTaxonomyTree(buildTaxonomyTree(categories)),
    [categories]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      const pub = resolvePublishing(item.schemaAttributes);
      if (categoryFilter !== "all" && !pub.categories.includes(categoryFilter)) {
        return false;
      }
      if (tagFilter !== "all" && !pub.tags.includes(tagFilter)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inSlug = item.slug.toLowerCase().includes(q);
        const inKw = (pub.focusKeyword ?? "").toLowerCase().includes(q);
        if (!inTitle && !inSlug && !inKw) return false;
      }
      return true;
    });
  }, [items, statusFilter, categoryFilter, tagFilter, searchQuery]);

  const avgSeoScore = useMemo(() => {
    if (filteredItems.length === 0) return 0;
    const sum = filteredItems.reduce((acc, it) => acc + (it.seoScore ?? 90), 0);
    return Math.round(sum / filteredItems.length);
  }, [filteredItems]);

  const allSelected =
    filteredItems.length > 0 &&
    filteredItems.every((it) => selectedIds.includes(it.contentId));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((it) => it.contentId));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openQuickEdit = (item: ContentDto) => {
    if (quickEditId === item.contentId) {
      setQuickEditId(null);
      return;
    }
    const pub = resolvePublishing(item.schemaAttributes);
    setQuickEditId(item.contentId);
    setQeTitle(item.title);
    setQeSlug(item.slug);
    setQeStatus((item.status as ContentStatus) ?? "published");
    setQeVisibility(pub.visibility);
    setQeImportance(item.importanceScore ?? 8);
    setQeNoIndex(Boolean(item.noIndex));
    setQeTldr(item.tldr ?? "");
    setQeCategories(pub.categories);
    setQeTags(pub.tags);
  };

  const handleSaveQuickEdit = (contentId: string) => {
    startTransition(async () => {
      await patchContentAction({
        contentId,
        title: qeTitle,
        slug: qeSlug,
        status: qeStatus,
        visibility: qeVisibility,
        importanceScore: qeImportance,
        noIndex: qeNoIndex,
        tldr: qeTldr,
        categories: qeCategories,
        tags: qeTags,
      });
      setItems((prev) =>
        prev.map((it) => {
          if (it.contentId !== contentId) return it;
          const prevAttrs = (it.schemaAttributes ?? {}) as Record<string, any>;
          return {
            ...it,
            title: qeTitle,
            slug: qeSlug,
            status: qeStatus,
            importanceScore: qeImportance,
            noIndex: qeNoIndex,
            tldr: qeTldr,
            schemaAttributes: {
              ...prevAttrs,
              _publishing: {
                ...(prevAttrs._publishing ?? {}),
                visibility: qeVisibility,
                categories: qeCategories,
                tags: qeTags,
              },
            },
          };
        })
      );
      setQuickEditId(null);
      showToast("Hızlı düzenleme kaydedildi ve SEO Motoru güncellendi.");
      router.refresh();
    });
  };

  const handleBulkAction = (
    operation:
      | "publish"
      | "draft"
      | "scheduled"
      | "assign_category"
      | "assign_tag"
      | "delete"
  ) => {
    if (selectedIds.length === 0) return;
    if (operation === "assign_category" && !bulkCategorySlug) {
      showToast("Lütfen atanacak kategoriyi seçin.");
      return;
    }
    if (operation === "assign_tag" && !bulkTagSlug) {
      showToast("Lütfen atanacak etiketi seçin.");
      return;
    }

    startTransition(async () => {
      const res = await bulkContentAction({
        contentIds: selectedIds,
        operation,
        categorySlug: bulkCategorySlug || undefined,
        tagSlug: bulkTagSlug || undefined,
      });

      if (operation === "delete") {
        setItems((prev) =>
          prev.filter((it) => !selectedIds.includes(it.contentId))
        );
        showToast(`${res.affected} içerik kalıcı olarak silindi.`);
      } else {
        showToast(`Toplu işlem tamamlandı (${res.affected} içerik güncellendi).`);
      }
      setSelectedIds([]);
      router.refresh();
    });
  };

  const handleDuplicate = (contentId: string) => {
    startTransition(async () => {
      await duplicateContentAction({ contentId });
      showToast("İçerik kopyası (Taslak) olarak oluşturuldu.");
      router.refresh();
    });
  };

  const handleSingleDelete = (contentId: string) => {
    startTransition(async () => {
      await bulkContentAction({
        contentIds: [contentId],
        operation: "delete",
      });
      setItems((prev) => prev.filter((it) => it.contentId !== contentId));
      showToast("İçerik silindi.");
      router.refresh();
    });
  };

  const isPage = mode === "page";
  const labelSingular = isPage ? "Sayfa" : "Blog Yazısı";
  const labelPlural = isPage ? "Sayfalar" : "Blog Yazıları";

  return { mode, initialItems, taxonomies, isPending, startTransition, items, setItems, searchQuery, setSearchQuery, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, tagFilter, setTagFilter, selectedIds, setSelectedIds, bulkCategorySlug, setBulkCategorySlug, bulkTagSlug, setBulkTagSlug, quickEditId, setQuickEditId, qeTitle, setQeTitle, qeSlug, setQeSlug, qeStatus, setQeStatus, qeVisibility, setQeVisibility, qeImportance, setQeImportance, qeNoIndex, setQeNoIndex, qeTldr, setQeTldr, qeCategories, setQeCategories, qeTags, setQeTags, toastMsg, setToastMsg, router, showToast, categories, tags, flatCategoryTree, filteredItems, avgSeoScore, allSelected, toggleSelectAll, toggleSelectRow, openQuickEdit, handleSaveQuickEdit, handleBulkAction, handleDuplicate, handleSingleDelete, isPage, labelSingular, labelPlural };
}

export type ContentListState = ReturnType<typeof useContentList>;
