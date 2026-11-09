'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronDown,
  Search,
  Menu,
  X,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { searchAllContentClient as searchAllContent } from '@/lib/search-client';

interface SubMenuItem {
  label: string;
  description?: string;
  href: string;
}

interface PrimaryNavItem {
  label: string;
  href: string;
  items: SubMenuItem[];
}

const PRIMARY_NAV: PrimaryNavItem[] = [
  {
    label: 'ERP Çözümleri',
    href: '/kurumsal-kaynak-planlama/',
    items: [
      {
        label: 'Wolvox ERP',
        description: 'Kurumsal Kaynak Planlama',
        href: '/wolvox-erp/',
      },
      {
        label: 'Wolvox İK',
        description: 'İnsan Kaynakları Yönetimi',
        href: '/insan-kaynaklari-yonetimi/',
      },
      {
        label: 'Wolvox CRM',
        description: 'Müşteri İlişkileri Yönetimi',
        href: '/wolvox-crm-yonetimi/',
      },
      {
        label: 'Wolvox Webconnect',
        href: '/wolvox-webconnect/',
      },
      {
        label: 'Wolvox MRP Üretim Yöntemi',
        href: '/wolvox-uretim-yontemi/',
      },
    ],
  },
  {
    label: 'Muhasebe Programları',
    href: '/muhasebe-programlari/',
    items: [
      {
        label: 'Ön Muhasebe Yazılımı',
        description: 'Akınsoft Muhasebe Programı',
        href: '/on-muhasebe-programi/',
      },
      {
        label: 'Genel Muhasebe Yazılımı',
        href: '/genel-muhasebe-programi/',
      },
      {
        label: 'OctoCloud',
        description: 'Bulut Muhasebe',
        href: '/octocloud/',
      },
      {
        label: 'Octo Plus',
        description: 'Kolay Muhasebe Programı',
        href: '/octoplus/',
      },
    ],
  },
  {
    label: 'Sektörel Programlar',
    href: '/sektorel-cozumler/',
    items: [
      {
        label: 'Wolvox Restoran',
        description: 'Restoran (Adisyon) Programı',
        href: '/akinsoft-wolvox-restoran-yonetimi/',
      },
      {
        label: 'Mobil Satış',
        description: 'Saha Satış Yazılımı',
        href: '/mobil-satis/',
      },
      {
        label: 'Süper Market Yazılımı',
        description: 'Market Satış Programı',
        href: '/super-market-yonetimi/',
      },
      {
        label: 'Wolvox Hızlı Satış Programı',
        description: 'Barkodlu Satış Programı',
        href: '/wolvox-hizli-satis/',
      },
      {
        label: 'Otel Yönetimi Programı',
        href: '/otel-yonetimi-programi/',
      },
      {
        label: 'Sürücü Kursu Otomasyonu',
        href: '/surucu-kursu-otomasyonu/',
      },
      {
        label: 'Servis Yönetimi',
        href: '/servis-yonetimi/',
      },
      {
        label: 'Wolvox Fiyatmatik',
        description: 'Fiyat Gösterme Ekranı',
        href: '/fiyatmatik/',
      },
    ],
  },
  {
    label: 'E-Dönüşüm',
    href: '/akinsoft-e-donusum/',
    items: [
      { label: 'E-Arşiv Fatura', href: '/e-arsiv-fatura/' },
      { label: 'e-Defter', href: '/e-defter/' },
      { label: 'e-Fatura', href: '/e-fatura/' },
      { label: 'e-İrsaliye', href: '/e-irsaliye/' },
      { label: 'e-Müstahsil Makbuzu', href: '/e-mustahsil-makbuzu/' },
      { label: 'E-Adisyon', href: '/e-adisyon/' },
      { label: 'e-Mutabakat', href: '/e-mutabakat/' },
    ],
  },
  {
    label: 'Bulut Yazılımlar',
    href: '/bulut-yazilim-cozumleri/',
    items: [
      { label: 'E-Ticaret', href: '/e-ticaret/' },
      { label: 'Yedekleme Programı', href: '/bulut-yedekleme-programi/' },
      { label: 'Akınsoft MyFranchise', href: '/akinsoft-myfranchise/' },
      { label: 'E-Ofis Yazılımı', href: '/e-ofis/' },
      {
        label: 'Hotel Smart – Otel Rezervasyon Yazılımı',
        href: '/hotel-smart/',
      },
      { label: 'Pro Kuaför – Randevu Yazılımı', href: '/prokuafor/' },
      { label: 'QR Menü', href: '/qr-menu/' },
      { label: 'KDV Hesaplama Aracı', href: '/kdv-hesaplama-araci/' },
    ],
  },
];

const KURUMSAL_SUB: SubMenuItem[] = [
  { label: 'Kampanyalar', href: '/akinsoft-kampanyalar/' },
  { label: 'Hakkımızda', href: '/hakkimizda/' },
  { label: 'Akınsoft SSS', href: '/akinsoft-sikca-sorulan-sorular/' },
  { label: 'AI Prompts', href: '/ai-prompts/' },
];

const BLOG_SUB: SubMenuItem[] = [
  { label: 'Makaleler', href: '/makaleler/' },
  { label: 'Akınsoft Kampanyalar', href: '/akinsoft-kampanyalar/' },
  { label: 'Bilgi Bankası', href: '/bilgi-bankasi/' },
  { label: 'Duyurular', href: '/duyurular/' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMobileSub, setOpenMobileSub] = useState<string | null>(null);

  const searchResults = searchQuery.length >= 2 ? searchAllContent(searchQuery) : [];

  const toggleMobileSub = (label: string) => {
    setOpenMobileSub((prev) => (prev === label ? null : label));
  };

  return (
    <>
      <header id="masthead" className="sticky top-0 z-40 bg-white shadow-xs">
        {/* Top Header Bar - Kadence Secondary Bar */}
        <div className="hidden lg:block bg-white border-b border-[#d9e9e7] text-[15px]">
          <div className="max-w-[1290px] mx-auto px-6 min-h-[44px] flex items-center justify-between gap-4">
            {/* Left HTML */}
            <div className="flex items-center gap-3 text-[#252424]">
              <p className="m-0">
                <Link
                  href="/"
                  className="font-semibold text-[#0c644e] hover:text-[#09589a] transition-colors"
                >
                  Akınsoft İzmir Ana Bayi
                </Link>{' '}
                <span>- Dijital Evre</span>
              </p>
            </div>

            {/* Center Secondary Navigation */}
            <div className="flex items-center gap-4">
              <div className="h-4 border-r border-[#09589a]" />
              <nav aria-label="İkincil" className="flex items-center gap-5 font-semibold text-[#1a202c]">
                <Link
                  href="/akinsoft-demo-talebi/"
                  className="py-1.5 hover:text-[#0c644e] transition-colors whitespace-nowrap"
                >
                  Demo Talebi
                </Link>
                <Link
                  href="/akinsoft-destek/"
                  className="py-1.5 hover:text-[#0c644e] transition-colors whitespace-nowrap"
                >
                  Destek Talebi
                </Link>

                {/* Kurumsal Dropdown */}
                <div className="relative group">
                  <button
                    type="button"
                    className="flex items-center gap-1 py-1.5 hover:text-[#0c644e] transition-colors whitespace-nowrap"
                  >
                    <span>Kurumsal</span>
                    <ChevronDown className="w-4 h-4 opacity-75" />
                  </button>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-1 z-50 w-52">
                    <div className="bg-white rounded-md shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-100 py-2">
                      {KURUMSAL_SUB.map((sub) => (
                        <Link
                          key={sub.href + sub.label}
                          href={sub.href}
                          className="block px-4 py-2 text-sm font-medium text-[#1a202c] hover:bg-[#f7fafc] hover:text-[#0c644e] transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Blog Dropdown */}
                <div className="relative group">
                  <Link
                    href="/blog/"
                    className="flex items-center gap-1 py-1.5 hover:text-[#0c644e] transition-colors whitespace-nowrap"
                  >
                    <span>Blog</span>
                    <ChevronDown className="w-4 h-4 opacity-75" />
                  </Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-1 z-50 w-52">
                    <div className="bg-white rounded-md shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-slate-100 py-2">
                      {BLOG_SUB.map((sub) => (
                        <Link
                          key={sub.href + sub.label}
                          href={sub.href}
                          className="block px-4 py-2 text-sm font-medium text-[#1a202c] hover:bg-[#f7fafc] hover:text-[#0c644e] transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  href="/iletisim/"
                  className="py-1.5 hover:text-[#0c644e] transition-colors whitespace-nowrap"
                >
                  İletişim
                </Link>
              </nav>
            </div>

            {/* Right Phone CTA & Search */}
            <div className="flex items-center gap-4">
              <a
                href="tel:+902324251988"
                className="font-bold text-[20px] xl:text-[22px] text-[#0c644e] hover:text-[#09589a] px-2 py-1 transition-colors tabular-nums whitespace-nowrap"
              >
                0 232 425 19 88
              </a>
              <div className="h-5 border-r border-[#0f4c81]/40" />
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Arama formunu görüntüle"
                className="p-1.5 text-[#1a202c] hover:text-[#0c644e] transition-colors cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Header Row */}
        <div className="bg-white border-b border-[#efefef]">
          <div className="max-w-[1290px] mx-auto px-4 sm:px-6 min-h-[72px] flex items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center py-2">
              <Image
                src="/images/akinsoft-logo-yatay-ba35022.webp"
                alt="Akınsoft Ana Bayi Logo"
                width={200}
                height={46}
                priority
                referrerPolicy="no-referrer"
                className="w-[160px] sm:w-[200px] h-auto object-contain"
              />
            </Link>

            {/* Primary Desktop Navigation */}
            <nav
              aria-label="Birincil"
              className="hidden lg:flex items-center gap-1 xl:gap-2"
            >
              {PRIMARY_NAV.map((item) => (
                <div key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-[17px] xl:text-[18px] font-semibold text-[#1a202c] hover:text-[#0c644e] transition-colors whitespace-nowrap"
                  >
                    <span>{item.label}</span>
                    <ChevronDown className="w-4 h-4 opacity-75 group-hover:rotate-180 transition-transform duration-150" />
                  </Link>

                  {/* Submenu */}
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-0 top-full pt-1 z-50 w-72">
                    <div className="bg-white rounded-lg shadow-[0_12px_50px_rgba(0,0,0,0.08)] border border-slate-100 py-2">
                      {item.items.map((sub) => (
                        <Link
                          key={sub.href + sub.label}
                          href={sub.href}
                          className="block px-4 py-2.5 hover:bg-[#f7fafc] transition-colors group/sub"
                        >
                          <div className="text-[15px] font-semibold text-[#1a202c] group-hover/sub:text-[#0c644e] transition-colors">
                            {sub.label}
                          </div>
                          {sub.description && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {sub.description}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </nav>

            {/* Mobile Controls */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Ara"
                className="p-2.5 text-[#1a202c] hover:text-[#0c644e] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Menüyü Aç"
                className="p-2.5 text-[#1a202c] hover:text-[#0c644e] transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen Search Modal Drawer (Kadence Search Drawer) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#0c644e] shrink-0" />
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Yazılım, modül, e-Fatura veya makale ara (örn: Wolvox, OctoCloud, Restoran)..."
                className="w-full text-base sm:text-lg text-[#060a0d] placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Kapat"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-5">
              {searchQuery.length < 2 ? (
                <div className="text-sm text-slate-500 py-4 text-center">
                  Aramaya başlamak için en az 2 karakter yazın. Hızlı erişim:{' '}
                  <Link
                    href="/wolvox-erp/"
                    onClick={() => setSearchOpen(false)}
                    className="text-[#09589a] font-medium hover:underline mx-1"
                  >
                    Wolvox ERP
                  </Link>
                  ·
                  <Link
                    href="/octocloud/"
                    onClick={() => setSearchOpen(false)}
                    className="text-[#09589a] font-medium hover:underline mx-1"
                  >
                    OctoCloud
                  </Link>
                  ·
                  <Link
                    href="/e-fatura/"
                    onClick={() => setSearchOpen(false)}
                    className="text-[#09589a] font-medium hover:underline mx-1"
                  >
                    e-Fatura
                  </Link>
                  ·
                  <Link
                    href="/kdv-hesaplama-araci/"
                    onClick={() => setSearchOpen(false)}
                    className="text-[#09589a] font-medium hover:underline mx-1"
                  >
                    KDV Hesaplama
                  </Link>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-sm text-slate-500 py-6 text-center">
                  &ldquo;{searchQuery}&rdquo; için sonuç bulunamadı.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((res) => (
                    <Link
                      key={res.href + res.title}
                      href={res.href}
                      onClick={() => setSearchOpen(false)}
                      className="block py-3 px-3 hover:bg-slate-50 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#060a0d] group-hover:text-[#0c644e] transition-colors">
                          {res.title}
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">
                          {res.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1 mb-0">
                        {res.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 lg:hidden flex justify-end"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#060a0d] text-white h-full overflow-y-auto p-5 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="font-bold text-base text-white">
                  Akınsoft İzmir Ana Bayi
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Menüyü Kapat"
                  className="p-2 text-slate-300 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <ul className="mt-4 divide-y divide-white/10">
                {PRIMARY_NAV.map((item) => {
                  const isOpen = openMobileSub === item.label;
                  return (
                    <li key={item.label} className="py-1">
                      <div className="flex items-center justify-between">
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="py-2.5 text-[15px] font-semibold text-slate-100 hover:text-emerald-400"
                        >
                          {item.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleMobileSub(item.label)}
                          aria-label="Alt menüyü aç/kapat"
                          className="p-2.5 text-slate-300 hover:text-white"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                      {isOpen && (
                        <ul className="pl-4 pb-2 space-y-1.5 border-l border-white/15 ml-1">
                          {item.items.map((sub) => (
                            <li key={sub.href + sub.label}>
                              <Link
                                href={sub.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-1.5 text-sm text-slate-300 hover:text-white"
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}

                {/* Kurumsal Mobile */}
                <li className="py-1">
                  <div className="flex items-center justify-between">
                    <span className="py-2.5 text-[15px] font-semibold text-slate-100">
                      Kurumsal
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleMobileSub('Kurumsal')}
                      className="p-2.5 text-slate-300 hover:text-white"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          openMobileSub === 'Kurumsal' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                  {openMobileSub === 'Kurumsal' && (
                    <ul className="pl-4 pb-2 space-y-1.5 border-l border-white/15 ml-1">
                      <li>
                        <Link
                          href="/akinsoft-demo-talebi/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-sm text-slate-300 hover:text-white"
                        >
                          Akınsoft Demo Talebi
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/akinsoft-destek/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-sm text-slate-300 hover:text-white"
                        >
                          Akınsoft Destek
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/iletisim/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-sm text-slate-300 hover:text-white"
                        >
                          İletişim
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/hakkimizda/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-sm text-slate-300 hover:text-white"
                        >
                          Hakkımızda
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/online-lisans-kontrol/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-sm text-slate-300 hover:text-white"
                        >
                          Online Lisans Kontrol
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/ai-prompts/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-sm text-slate-300 hover:text-white"
                        >
                          AI Prompts
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/akinsoft-kampanyalar/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-sm text-slate-300 hover:text-white"
                        >
                          Akınsoft Kampanyalar
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/blog/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-sm text-slate-300 hover:text-white"
                        >
                          Blog
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
              </ul>
            </div>

            <div className="pt-6 space-y-2.5 border-t border-white/10 mt-6">
              <a
                href="tel:+902324251988"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-white/80 text-white font-semibold text-base hover:border-[#09589a] transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Ara: 0 232 425 19 88</span>
              </a>
              <Link
                href="/akinsoft-demo-talebi/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#0c644e] hover:bg-[#09589a] text-white font-semibold text-base transition-colors"
              >
                <span>Ücretsiz Demo Talebi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
