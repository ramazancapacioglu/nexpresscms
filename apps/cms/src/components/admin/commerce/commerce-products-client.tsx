"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { CommerceProductDto } from "@nexpress/commerce";
import { formatMoney } from "@nexpress/commerce";
import { deleteCommerceProductAction } from "@/app/admin/commerce/actions";

const statusLabel: Record<string, string> = {
  draft: "Taslak",
  published: "Yayında",
};

export function CommerceProductsClient({ products }: { products: CommerceProductDto[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold">Ürünler</h1>
          <p className="text-[12px] text-[#8C9099]">Katalog, fiyat ve stok yönetimi.</p>
        </div>
        <Link
          href="/admin/commerce/products/yeni"
          className="rounded-md bg-[#111318] px-3 py-2 text-[12px] font-medium text-white dark:bg-white dark:text-[#111318]"
        >
          Yeni ürün
        </Link>
      </header>

      {products.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#E6E7EA] p-6 text-[13px] text-[#8C9099] dark:border-[#23262E]">
          Henüz ürün yok. Seed çalıştırabilir veya yeni ürün ekleyebilirsiniz.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E6E7EA] dark:border-[#23262E]">
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead className="bg-[#F7F8FA] text-[#8C9099] dark:bg-[#14161B]">
              <tr>
                <th className="px-3 py-2 font-medium">Ürün</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Fiyat</th>
                <th className="px-3 py-2 font-medium">Stok</th>
                <th className="px-3 py-2 font-medium">Durum</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-[#E6E7EA] dark:border-[#23262E]">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/commerce/products/${p.id}`}
                      className="font-medium text-[#111318] hover:underline dark:text-[#F4F5F7]"
                    >
                      {p.name}
                    </Link>
                    <div className="text-[11px] text-[#8C9099]">/{p.slug}</div>
                  </td>
                  <td className="px-3 py-2">{p.sku}</td>
                  <td className="px-3 py-2">{formatMoney(p.priceCents, p.currency)}</td>
                  <td className="px-3 py-2">{p.stockQuantity}</td>
                  <td className="px-3 py-2">{statusLabel[p.status] ?? p.status}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      disabled={pending}
                      className="text-[11px] text-red-600 hover:underline disabled:opacity-50"
                      onClick={() =>
                        start(async () => {
                          if (!confirm(`"${p.name}" silinsin mi?`)) return;
                          await deleteCommerceProductAction(p.id);
                          router.refresh();
                        })
                      }
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
