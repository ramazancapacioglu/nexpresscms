import React from 'react';
import Link from 'next/link';
import { Home, Search, Phone } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="py-20 bg-[#f7fafc] text-center px-6">
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-xs">
        <div className="text-5xl font-extrabold text-[#0c644e] mb-3 tabular-nums">
          404
        </div>
        <h1 className="text-2xl font-bold text-[#060a0d] mb-3">
          Aradığınız Sayfa Bulunamadı
        </h1>
        <p className="text-base text-[#252424] mb-6">
          Aradığınız yazılım çözümü veya sayfa taşınmış olabilir. Aşağıdaki
          bağlantılardan ana sayfaya dönebilir veya ücretsiz demo talebinde
          bulunabilirsiniz.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0c644e] hover:bg-[#09589a] text-white font-semibold rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Ana Sayfaya Dön</span>
          </Link>
          <Link
            href="/akinsoft-demo-talebi/"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#09589a] hover:bg-[#0f4c81] text-white font-semibold rounded-lg transition-colors"
          >
            <span>Ücretsiz Demo Talebi</span>
          </Link>
          <a
            href="tel:+902324251988"
            className="inline-flex items-center gap-2 px-5 py-3 border border-slate-300 hover:border-[#0c644e] text-[#060a0d] font-semibold rounded-lg transition-colors tabular-nums"
          >
            <Phone className="w-4 h-4 text-[#0c644e]" />
            <span>0 232 425 19 88</span>
          </a>
        </div>
      </div>
    </main>
  );
}
