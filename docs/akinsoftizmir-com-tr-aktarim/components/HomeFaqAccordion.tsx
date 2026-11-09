'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  paragraphs: React.ReactNode[];
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'neden-akinsoft',
    question: 'Neden Akınsoft ?',
    paragraphs: [
      <>
        <strong>İzmir</strong>&lsquo;de başka <strong>Akınsoft bayisi</strong>{' '}
        de var. Bizi farklı kılan, yazılımı satıp gitmiyoruz. 200&rsquo;den
        fazla aktif müşterimiz, sorularını bize telefon ya da WhatsApp ile
        ilettiğinde 4 iş saati içinde yanıt alıyor. Kurulum günü oradayız,
        güncelleme geldiğinde bilgilendiriyoruz, yılsonu devir işlemlerinde
        birlikte çalışıyoruz. Resmi bayi kodumuzu (BA35022) taşıyan,{' '}
        <strong>Akınsoft</strong> tarafından &lsquo;
        <strong>Ana Bayi ve Çözüm Ortağı</strong>&lsquo; olarak tescillenmiş
        İzmir noktasıyız.
      </>,
    ],
  },
  {
    id: 'akinsoft-nedir',
    question: 'Akınsoft Nedir ?',
    paragraphs: [
      <>
        Akınsoft, 1989&rsquo;dan bu yana Türkiye&rsquo;de faaliyet gösteren
        yerli yazılım şirketidir. ERP, muhasebe, e-Dönüşüm ve sektörel yazılım
        alanlarında 150.000&rsquo;den fazla işletmeye hizmet veren Akınsoft;
        restoran, otel, market, imalat, inşaat ve hizmet sektörlerine özel
        modülleriyle Türkiye&rsquo;nin en köklü yazılım markalarından biri
        konumundadır.
      </>,
      <>
        Akınsoft ürünleri doğrudan şirketten değil, yetkili bayi ağı üzerinden
        sunulmaktadır. <strong>Akınsoft İzmir Ana Bayi</strong> olarak biz;
        Wolvox ERP, muhasebe programları, OctoCloud ve e-Dönüşüm çözümlerinin
        İzmir&rsquo;deki ve Türkiye genelindeki satış, kurulum, eğitim ve
        teknik destek süreçlerini yürütüyoruz.
      </>,
      <>
        Akınsoft yazılımı hakkında bilgi almak veya demo kurmak için bize
        ulaşabilirsiniz — resmi bayi kodumuzu (BA35022) taşıyan yetkili adresiz.
      </>,
    ],
  },
  {
    id: 'hangi-hizmetler',
    question: 'Akınsoft İzmir Ana Bayi olarak hangi hizmetleri sunuyorsunuz?',
    paragraphs: [
      <>
        ERP, muhasebe yazılımları, e-Dönüşüm ve sektörel programların satış,
        kurulum, eğitim ve teknik destek hizmetlerini sunuyoruz. İzmir&rsquo;de
        yerinde, Türkiye genelinde uzaktan hizmet veriyoruz. Resmi Bayi
        Kodumuzu (BA35022) taşıyan yetkili adresiz.
      </>,
    ],
  },
  {
    id: 'demo-ucretsiz-mi',
    question: 'Demo kurulumu ücretsiz mi?',
    paragraphs: [
      <>
        Evet. Wolvox ERP, OctoCloud ve tüm sektörel yazılımların 30 günlük
        ücretsiz deneme sürümünü kuruyoruz. İzmir&rsquo;de yerinde veya uzaktan
        bağlantıyla kurulum yapıyoruz.
      </>,
    ],
  },
];

export default function HomeFaqAccordion() {
  const [openId, setOpenId] = useState<string | null>('neden-akinsoft');

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={`rounded-lg border transition-colors bg-white overflow-hidden ${
              isOpen
                ? 'border-[#09589a]'
                : 'border-[#09589a]/60 hover:border-[#0c644e]'
            }`}
          >
            <h4>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left font-bold text-[16px] sm:text-[17px] text-[#060a0d] hover:text-[#0c644e] transition-colors cursor-pointer"
              >
                <span>{item.question}</span>
                {isOpen ? (
                  <Minus className="w-4 h-4 text-[#09589a] shrink-0" />
                ) : (
                  <Plus className="w-4 h-4 text-[#09589a] shrink-0" />
                )}
              </button>
            </h4>
            {isOpen && (
              <div className="px-4 pb-4 pt-1 text-[15.5px] leading-relaxed text-[#252424] space-y-2.5 border-t border-slate-100">
                {item.paragraphs.map((p, idx) => (
                  <p key={idx} className="m-0">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
