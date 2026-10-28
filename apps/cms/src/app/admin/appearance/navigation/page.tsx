import React from "react";
import Link from "next/link";

const LINKS = [
  { href: "/admin/appearance/header", title: "Header", text: "Duyuru, ana şerit, çağrı ve hazır şablonlar." },
  { href: "/admin/appearance/menus", title: "Menü", text: "Sürükle-bırak bağlantı ağacı. Header alanlarından ayrı." },
  { href: "/admin/appearance/footer", title: "Footer", text: "Kolonlar, bülten ve telif. Şablonlar düzenlenebilir." },
  { href: "/admin/appearance/sidebar", title: "Kenar çubuğu", text: "İçeriğin yanında duran site bağlantıları." },
];

export default function AppearanceHubPage() {
  return (
    <div className="space-y-4">
      <header className="border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <h1 className="text-[18px] font-semibold">Yerleşim</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Header, menü, footer ve kenar çubuğu sayfa bloklarından ayrı kayıtlardır.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]"
          >
            <div className="text-[13px] font-semibold">{item.title}</div>
            <p className="mt-1 text-[12px] text-[#5F6570] dark:text-[#8C9099]">{item.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
