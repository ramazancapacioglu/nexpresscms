'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
} from 'lucide-react';

const FOOTER_COLUMNS = [
  {
    title: 'Muhasebe Programları',
    links: [
      { label: 'Ön Muhasebe Programı', href: '/on-muhasebe-programi/' },
      { label: 'Genel Muhasebe Programı', href: '/genel-muhasebe-programi/' },
      { label: 'OctoCloud Bulut Muhasebe', href: '/octocloud/' },
      { label: 'OctoPlus Ön Muhasebe', href: '/octoplus/' },
    ],
  },
  {
    title: 'ERP Çözümleri',
    links: [
      { label: 'Wolvox ERP', href: '/wolvox-erp/' },
      { label: 'İnsan Kaynakları Yönetimi', href: '/insan-kaynaklari-yonetimi/' },
      { label: 'Wolvox CRM Yönetimi', href: '/wolvox-crm-yonetimi/' },
      { label: 'Wolvox Webconnect', href: '/wolvox-webconnect/' },
      { label: 'Wolvox MRP Üretim Yöntemi', href: '/wolvox-uretim-yontemi/' },
    ],
  },
  {
    title: 'Bulut Yazılımlar',
    links: [
      { label: 'E-ticaret', href: '/e-ticaret/' },
      { label: 'Akınsoft MyFranchise', href: '/akinsoft-myfranchise/' },
      { label: 'OctoCloud', href: '/octocloud/' },
      { label: 'Hotel Smart', href: '/hotel-smart/' },
      { label: 'Pro Kuaför – Randevu Yazılımı', href: '/prokuafor/' },
      { label: 'QR Menü', href: '/qr-menu/' },
      { label: 'E-Teklif', href: '/wolvox-webconnect-e-teklif/' },
    ],
  },
  {
    title: 'E-Dönüşüm',
    links: [
      { label: 'e-Fatura', href: '/e-fatura/' },
      { label: 'e-Arşiv Fatura', href: '/e-arsiv-fatura/' },
      { label: 'e-Defter', href: '/e-defter/' },
      { label: 'e-İrsaliye', href: '/e-irsaliye/' },
      { label: 'e-Müstahsil Makbuzu', href: '/e-mustahsil-makbuzu/' },
      { label: 'e-Adisyon', href: '/e-adisyon/' },
      { label: 'e-Mutabakat', href: '/e-mutabakat/' },
    ],
  },
  {
    title: 'Sektörel Yazılımlar',
    links: [
      {
        label: 'Wolvox Restoran Yönetimi',
        href: '/akinsoft-wolvox-restoran-yonetimi/',
      },
      { label: 'Wolvox Hızlı Satış Programı', href: '/wolvox-hizli-satis/' },
      { label: 'Süper Market Yönetimi', href: '/super-market-yonetimi/' },
      { label: 'Servis Yönetimi', href: '/servis-yonetimi/' },
      { label: 'Mobil Satış – Saha Satış Yazılımı', href: '/mobil-satis/' },
      { label: 'Otel Yönetimi Programı', href: '/otel-yonetimi-programi/' },
      { label: 'Sürücü Kursu Otomasyonu', href: '/surucu-kursu-otomasyonu/' },
    ],
  },
];

export default function Footer() {
  const [openAcc, setOpenAcc] = useState<string | null>(null);

  return (
    <footer id="colophon" className="bg-white border-t border-slate-200/80">
      {/* Top Footer Row */}
      <div className="bg-[#fafafa]/80 py-10 border-b border-[#062542]/15">
        <div className="max-w-[1290px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-center">
          {/* Col 1: Square BA35022 Logo */}
          <div className="lg:col-span-3 flex justify-center md:justify-start">
            <Link href="/" className="inline-block">
              <Image
                src="/images/akinsoft-logo-kare-ba35022.webp"
                alt="Akınsoft İzmir Ana Bayi BA35022"
                width={180}
                height={180}
                referrerPolicy="no-referrer"
                className="w-40 h-40 object-contain"
              />
            </Link>
          </div>

          {/* Col 2: Kurumsal Menu 1 */}
          <div className="lg:col-span-2">
            <ul className="space-y-2.5 text-[16px] font-medium text-[#252424]">
              <li>
                <Link
                  href="/iletisim/"
                  className="hover:text-[#0c644e] transition-colors"
                >
                  Akınsoft İletişim
                </Link>
              </li>
              <li>
                <Link
                  href="/akinsoft-demo-talebi/"
                  className="hover:text-[#0c644e] transition-colors"
                >
                  Demo Talebi
                </Link>
              </li>
              <li>
                <Link
                  href="/akinsoft-destek/"
                  className="hover:text-[#0c644e] transition-colors"
                >
                  Destek Talebi
                </Link>
              </li>
              <li>
                <Link
                  href="/gizlilik-politikasi/"
                  className="hover:text-[#0c644e] transition-colors"
                >
                  Gizlilik Politikası
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Kurumsal Menu 2 */}
          <div className="lg:col-span-3">
            <ul className="space-y-2.5 text-[16px] font-medium text-[#252424]">
              <li>
                <Link
                  href="/akinsoft-installer-indir/"
                  className="hover:text-[#0c644e] transition-colors"
                >
                  Akınsoft Ücretsiz İndir
                </Link>
              </li>
              <li>
                <Link
                  href="/online-lisans-kontrol/"
                  className="hover:text-[#0c644e] transition-colors"
                >
                  Online Lisans Kontrol
                </Link>
              </li>
              <li>
                <Link
                  href="/akinsoft-kampanyalar/"
                  className="hover:text-[#0c644e] transition-colors"
                >
                  Akınsoft Kampanyalar
                </Link>
              </li>
              <li>
                <Link
                  href="/bilgi-bankasi/"
                  className="hover:text-[#0c644e] transition-colors"
                >
                  Bilgi Bankası
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Info */}
          <div className="lg:col-span-4 space-y-2 text-[#252424]">
            <p className="text-[18px] leading-relaxed m-0">
              <strong>
                Telefon:{' '}
                <a
                  href="tel:+902324251988"
                  className="text-[#09589a] hover:text-[#0c644e] transition-colors tabular-nums"
                >
                  0 (232) 425 19 88
                </a>
              </strong>
              <br />
              <strong>Telefon: </strong>
              <a
                href="tel:+905444138094"
                className="font-bold text-[#09589a] hover:text-[#0c644e] transition-colors tabular-nums"
              >
                0 (544) 413 80 94
              </a>
            </p>
            <p className="text-[16px] leading-relaxed m-0 pt-1">
              <strong>Mail: </strong>
              <a
                href="mailto:bilgi@akinsoftizmir.com.tr"
                className="text-[#09589a] hover:underline"
              >
                bilgi@akinsoftizmir.com.tr
              </a>
              <br />
              <strong>Adres : </strong>Muciburrahman Sk. No:3/522 Konak İzmir
            </p>
          </div>
        </div>
      </div>

      {/* Middle Footer Row: 5 Columns on Desktop, Accordion on Mobile */}
      <div className="bg-[#fafafa]/50 py-10">
        <div className="max-w-[1290px] mx-auto px-6">
          {/* Desktop 5-Column Grid */}
          <div className="hidden md:grid md:grid-cols-5 gap-6">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-[18px] font-bold text-[#060a0d] mb-2">
                  {col.title}
                </h3>
                <hr className="border-slate-300 mb-3 w-16" />
                <ul className="space-y-2 text-[15px] text-[#252424]">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="hover:text-[#0c644e] transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile Accordion */}
          <div className="md:hidden space-y-2">
            {FOOTER_COLUMNS.map((col) => {
              const isOpen = openAcc === col.title;
              return (
                <div
                  key={col.title}
                  className="border border-slate-200 rounded-lg bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenAcc(isOpen ? null : col.title)}
                    className="w-full px-4 py-3 flex items-center justify-between font-bold text-[16px] text-[#060a0d]"
                  >
                    <span>{col.title}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="px-4 pb-3 space-y-2 text-[15px] text-[#252424] border-t border-slate-100 pt-2">
                      {col.links.map((l) => (
                        <li key={l.href + l.label}>
                          <Link
                            href={l.href}
                            className="block py-1 hover:text-[#0c644e]"
                          >
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Footer Row (#0f4c81) */}
      <div className="bg-[#0f4c81] text-white py-5 border-t border-[#fafafa]">
        <div className="max-w-[1290px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[15px] sm:text-[16px] m-0 text-center sm:text-left">
            © 2026{' '}
            <Link href="/" className="font-bold hover:underline">
              Akınsoft İzmir
            </Link>{' '}
            <strong>Ana Bayi</strong> tüm Hakları Saklıdır
          </p>

          <div className="flex items-center gap-2">
            <a
              href="https://www.facebook.com/akinsoftizmiir"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="p-2 rounded hover:bg-white/10 transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com/akinsoftizmirb1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="p-2 rounded hover:bg-white/10 transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/akinsoftizmirbayi"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-2 rounded hover:bg-white/10 transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/company/akinsoft-izmir/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Linkedin"
              className="p-2 rounded hover:bg-white/10 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://api.whatsapp.com/send/?phone=902324251988"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="p-2 rounded hover:bg-white/10 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="tel:+902324251988"
              aria-label="Telefon"
              className="p-2 rounded hover:bg-white/10 transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
