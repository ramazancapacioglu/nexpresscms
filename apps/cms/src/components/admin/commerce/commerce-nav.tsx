import Link from "next/link";

const LINKS = [
  { href: "/admin/commerce", label: "Özet" },
  { href: "/admin/commerce/products", label: "Ürünler" },
  { href: "/admin/commerce/orders", label: "Siparişler" },
  { href: "/admin/commerce/returns", label: "İade ve değişim" },
  { href: "/admin/commerce/customers", label: "Müşteriler" },
  { href: "/admin/commerce/categories", label: "Kategoriler" },
  { href: "/admin/commerce/attributes", label: "Nitelikler" },
  { href: "/admin/commerce/campaigns", label: "Kampanyalar" },
  { href: "/admin/commerce/shipping", label: "Kargo" },
  { href: "/admin/commerce/marketplaces", label: "Pazar yerleri" },
];

export function CommerceNav({ pathname }: { pathname: string }) {
  return (
    <nav className="mb-4 flex flex-wrap gap-1 border-b border-[#E6E7EA] pb-2 dark:border-[#23262E]">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin/commerce"
            ? pathname === "/admin/commerce"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-2 py-1 text-[12px] ${
              active
                ? "bg-[#111318] text-white dark:bg-white dark:text-[#111318]"
                : "text-[#8C9099] hover:bg-[#F4F5F6] dark:hover:bg-[#1C1E24]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
