import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronsRight,
  Monitor,
  Phone,
  CheckSquare,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import HomeFaqAccordion from '@/components/HomeFaqAccordion';
import { getPostsByCategory } from '@/lib/wp-data';

const SOLUTION_CARDS = [
  {
    title: 'Muhasebe Programı',
    description: 'Ön muhasebe ve Genel Muhasebe Çözümleri',
    href: '/muhasebe-programlari/',
    icon: '/images/akinsoft-muhasebe-programi-icon-01.webp',
  },
  {
    title: 'Sektörel Çözümler',
    description: 'Her sektöre hitap eden Sektörel Çözümler',
    href: '/sektorel-cozumler/',
    icon: '/images/akinsoft-sektorel-icon-01.webp',
  },
  {
    title: 'Bulut Çözümler',
    description: 'Bulut tabanlı yazılımlar ile işinizi her yerde.',
    href: '/bulut-yazilim-cozumleri/',
    icon: '/images/akinsoft-bulut-icon-01.webp',
  },
  {
    title: 'ERP Çözümleri',
    description: 'İşletmeniz için her detay düşünüldü.',
    href: '/wolvox-erp/',
    icon: '/images/akinsoft-erp-icon-01.webp',
  },
  {
    title: 'E-Dönüşümün',
    description: 'E-dönüşümün bütün süreci tek yazılımda.',
    href: '/akinsoft-e-donusum/',
    icon: '/images/akinsoft-e-donusum-icon-01.webp',
  },
  {
    title: 'Entegrasyonlarımız',
    description: 'Tek noktadan tüm akışı yönetin.',
    href: '/akinsoft-entegrasyonlar/',
    icon: '/images/akinsoft-entegrasyonlar-icon-01.webp',
  },
];

const MUHASEBE_CHECKLIST = [
  { label: 'Ön Muhasebe', href: '/on-muhasebe-programi/' },
  { label: 'Genel Muhasebe', href: '/genel-muhasebe-programi/' },
  { label: 'Bulut Muhasebe', href: '/octocloud/' },
];

const SEKTOREL_COL_1 = [
  { label: 'Servis Yönetimi', href: '/servis-yonetimi/' },
  { label: 'Market Otomasyonu', href: '/super-market-yonetimi/' },
  { label: 'Sürücü Kursu', href: '/surucu-kursu-otomasyonu/' },
];

const SEKTOREL_COL_2 = [
  { label: 'Otel Yönetimi', href: '/otel-yonetimi-programi/' },
  { label: 'Restoran yönetimi', href: '/akinsoft-wolvox-restoran-yonetimi/' },
  { label: 'Saha Satış', href: '/mobil-satis/' },
];

const EDONUSUM_CHECKLIST = [
  { label: 'E-Fatura', href: '/e-fatura/' },
  { label: 'E-arşiv Fatura', href: '/e-arsiv-fatura/' },
  { label: 'E-İrsaliye', href: '/e-irsaliye/' },
  { label: 'E-Müstahsil', href: '/e-mustahsil-makbuzu/' },
  { label: 'E-Defter', href: '/e-defter/' },
  { label: 'E-Mutabakat', href: '/e-mutabakat/' },
];

export default function HomePage() {
  // Category ID 32 is "Akınsoft Kampanyalar"
  const campaignPosts = getPostsByCategory(32).slice(0, 3);

  return (
    <article className="w-full">
      {/* SECTION 1: Hero (#Akinsoft) */}
      <section
        id="Akinsoft"
        className="bg-[#0b4b8a]/[0.04] py-12 lg:py-16 border-b border-slate-200/60"
      >
        <div className="max-w-[1290px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Hero Column */}
          <div>
            <h1 className="text-[28px] sm:text-[34px] lg:text-[38px] font-bold text-[#060a0d] leading-[1.22] mb-5 text-balance">
              Türkiye&rsquo;nin Yerli Yazılım Markası Akınsoft — İzmir Ana Bayi
            </h1>
            <p className="text-[17px] leading-[1.7] text-[#252424] m-0">
              <strong>AKINSOFT</strong>, Türkiye’nin öncü yerli yazılım markası
              olarak işletmelerin verimliliğini artıran ERP, MRP, muhasebe,
              e-dönüşüm ve sektörel yazılım çözümleri sunar.{' '}
              <strong>İzmir Ana Bayi</strong> olarak yalnızca İzmir’e değil,{' '}
              <strong>Türkiye’nin 81 iline ve yurt dışındaki işletmelere</strong>{' '}
              uçtan uca kurulum, entegrasyon ve teknik destek sağlıyoruz.
              2000’den fazla bayi yapısı ve <strong>150.000+</strong> işletmenin
              tercih ettiği güvenilir altyapı ile iş süreçlerinizi tek merkezden
              yönetmenize yardımcı oluyoruz.
            </p>
          </div>

          {/* Right Hero Image Collage (60% / 40% Golden Split) */}
          <div className="hidden md:grid grid-cols-12 gap-4 items-center">
            <div className="col-span-7">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md border border-slate-200/60 bg-white">
                <Image
                  src="/images/akinsoft-my-franchise-yonetimi-yazilimi.webp"
                  alt="Akınsoft Myfranchise Yönetimi Yazılımı"
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="col-span-5 flex flex-col gap-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md border border-slate-200/60 bg-white">
                <Image
                  src="/images/Akinsoft-wolvox-restoran-programi-03.webp"
                  alt="Akınsoft Restoran Programı - Sektörel Çözümler"
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md border border-slate-200/60 bg-white">
                <Image
                  src="/images/akinsoft-servis-programi-03.webp"
                  alt="Akınsoft Servis Programı - Sektörel Çözümler"
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Akınsoft Yazılım Çözümleri (#Akinsoft-urun-ve-hizmetler) */}
      <section
        id="Akinsoft-urun-ve-hizmetler"
        className="bg-[#09589a]/[0.04] pt-12 pb-10"
      >
        <div className="max-w-[1290px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 1/3 Column */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-[26px] sm:text-[30px] font-bold text-[#060a0d] leading-tight">
              Akınsoft Yazılım Çözümleri
            </h2>
            <p className="text-[16.5px] leading-[1.7] text-[#252424]">
              Küçük ölçekli işletmelerden büyük kuruluşlara kadar geniş bir
              müşteri kitlesine hitap eden, çeşitli sektörlere yönelik yazılım
              ve teknoloji çözümleri sunmaktayız.{' '}
              <strong>Akınsoft İzmir Ana Bayi</strong> olarak, ihtiyaçlarınıza
              uygun doğru çözümleri belirlemenize yardımcı olmak için buradayız.
            </p>
            <div className="pt-1">
              <Link
                href="/akinsoft-demo-talebi/"
                className="inline-flex items-center gap-2 bg-[#0c644e] hover:bg-[#0f4c81] text-white font-semibold px-7 py-4 rounded-[3px] shadow-xs hover:shadow-md transition-all"
              >
                <span>Sizi Arayalım</span>
                <ChevronsRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Right 2/3 Column: 6 InfoBox Cards in 3x2 Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {SOLUTION_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white border border-[#0c644e]/40 hover:border-[#09589a]/60 rounded-[10px] py-6 px-4 transition-all hover:shadow-md flex flex-col justify-start"
              >
                <div className="w-10 h-10 mb-2 relative">
                  <Image
                    src={card.icon}
                    alt={`${card.title} Icon`}
                    width={40}
                    height={40}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="text-[20px] font-bold text-[#060a0d] group-hover:text-[#0c644e] leading-[1.2] mt-1 mb-2.5 transition-colors">
                  {card.title}
                </div>
                <p className="text-[15.5px] text-[#252424] leading-[1.6] m-0">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Prominent Blue Call-to-Action Strip (Row 2875_c0f99c-6a) */}
      <section className="py-6 relative z-10">
        <div className="max-w-[1290px] mx-auto px-6">
          <div className="bg-[#0b4b8a] rounded-[10px] shadow-[0_0_14px_0_rgba(0,0,0,0.2)] px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Col 1 (2fr / 6 cols) */}
            <div className="lg:col-span-6 text-white">
              <p className="text-[19px] sm:text-[21px] leading-snug m-0">
                <strong>Sizi geleceğe hazırlayan çözümler!</strong>
                <br />
                <span className="font-normal text-white/95 text-[17px] sm:text-[18px]">
                  Ücretsiz demo kurulumu için iletişime geçin
                </span>
              </p>
            </div>

            {/* Col 2 (1fr / 3 cols): ÜCRETSİZ Demo kurulumu */}
            <div className="lg:col-span-3">
              <Link
                href="/akinsoft-demo-talebi/"
                aria-label="Ücretsiz Demo kurulumu"
                className="flex items-center gap-3 border-2 border-white hover:border-[#f7fafc] rounded-[10px] px-3 py-2.5 transition-all hover:shadow-md group"
              >
                <div className="w-14 h-14 rounded-full bg-[#fafafa] text-[#0c644e] group-hover:text-[#09589a] flex items-center justify-center shrink-0 transition-colors">
                  <Monitor className="w-7 h-7" />
                </div>
                <div className="text-white">
                  <div className="text-[18px] font-bold tracking-tight leading-tight">
                    ÜCRETSİZ
                  </div>
                  <div className="text-[16px] font-semibold text-white/95">
                    Demo kurulumu
                  </div>
                </div>
              </Link>
            </div>

            {/* Col 3 (1fr / 3 cols): HEMEN ARA 0 232 425 19 88 */}
            <div className="lg:col-span-3">
              <a
                href="tel:+902324251988"
                aria-label="Hemen Ara 0 232 425 19 88"
                className="flex items-center gap-3 border-2 border-white hover:border-[#f7fafc] rounded-[10px] px-3 py-2.5 transition-all hover:shadow-md group"
              >
                <div className="w-14 h-14 rounded-full bg-[#fafafa] text-[#0c644e] group-hover:text-[#09589a] flex items-center justify-center shrink-0 transition-colors">
                  <Phone className="w-7 h-7" />
                </div>
                <div className="text-white">
                  <div className="text-[18px] font-bold tracking-tight leading-tight">
                    HEMEN ARA
                  </div>
                  <div className="text-[16px] font-semibold text-white/95 tabular-nums whitespace-nowrap">
                    0 232 425 19 88
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Muhasebe Programları (#muhasebe-programlari) */}
      <section id="muhasebe-programlari" className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1290px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-100">
            <Image
              src="/images/muhasebe-programlari-akinsoft.webp"
              alt="Akınsoft Muhasebe Programları"
              width={1024}
              height={683}
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Right Content */}
          <div>
            <h3 className="text-[24px] sm:text-[26px] font-bold text-[#060a0d] mb-3">
              Muhasebe Programları
            </h3>
            <hr className="border-slate-300 w-24 mb-5" />
            <p className="text-[16.5px] leading-[1.72] text-[#252424] mb-6">
              Ön muhasebeden genel muhasebeye, bulut tabanlı çözümden mali
              müşavir entegrasyonuna kadar her ölçekteki işletme için doğru
              muhasebe yazılımını sunuyoruz.{' '}
              <strong>
                <em>
                  Ön Muhasebe ile cari takibi, stok ve faturayı tek ekranda
                  yönetirken; Wolvox Genel Muhasebe ile yasal defterler, bilanço
                  ve e-Defter süreçlerini otomatikleştirirsiniz.
                </em>
              </strong>{' '}
              Bulut tercih ediyorsanız OctoCloud ile muhasebe verinize her
              cihazdan ulaşırsınız. Tüm programlar e-Fatura, e-İrsaliye ve
              e-Defter ile entegre çalışır ve harici yazılıma gerek kalmaz.
            </p>

            {/* 3-Column Icon List */}
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MUHASEBE_CHECKLIST.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-[#f8fffe] border border-[#0c644e]/20 hover:border-[#09589a] font-semibold text-[#060a0d] hover:text-[#0c644e] transition-colors"
                  >
                    <CheckSquare className="w-5 h-5 text-[#0c644e] shrink-0" />
                    <span className="text-[15px]">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 5: Sektörünüze Özel Yazılım (#sektorel-cozumler) */}
      <section
        id="sektorel-cozumler"
        className="bg-[#f8fffe] py-12 lg:py-16 border-y border-emerald-900/10"
      >
        <div className="max-w-[1290px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left Content */}
          <div>
            <h3 className="text-[24px] sm:text-[26px] font-bold text-[#060a0d] mb-4">
              Sektörünüze Özel Yazılım
            </h3>
            <p className="text-[16.5px] leading-[1.72] text-[#252424] mb-6">
              Her işletme aynı yazılımla yönetilemez. Restoranın masasından
              akaryakıt istasyonunun pompasına, otel resepsiyonundan sürücü
              kursunun ders takibine kadar — her sektörün kendi iş akışı, kendi
              öncelikleri vardır.
              <br />
              <strong>Akınsoft</strong> bu gerçekten yola çıkarak her sektör
              için ayrı modüller geliştirdi:{' '}
              <strong>
                <em>
                  Restoran Yönetimi, Otel Yönetimi, Akaryakıt İstasyonu, Servis
                  Yönetimi, Oto Galeri, Sürücü Kursu, Saha Satış ve Hızlı Satış
                  çözümleri hepsi aynı güçlü ERP altyapısı üzerinde çalışır.
                </em>
              </strong>
              <br />
              Hangi sektörde olursanız olun, doğru modülü birlikte belirliyor ve
              işletmenize özel kuruyoruz.
            </p>

            {/* 2x3 Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ul className="space-y-2.5">
                {SEKTOREL_COL_1.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-[#0c644e]/20 hover:border-[#09589a] font-semibold text-[#060a0d] hover:text-[#0c644e] transition-colors shadow-2xs"
                    >
                      <CheckSquare className="w-5 h-5 text-[#0c644e] shrink-0" />
                      <span className="text-[15.5px]">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="space-y-2.5">
                {SEKTOREL_COL_2.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-[#0c644e]/20 hover:border-[#09589a] font-semibold text-[#060a0d] hover:text-[#0c644e] transition-colors shadow-2xs"
                    >
                      <CheckSquare className="w-5 h-5 text-[#0c644e] shrink-0" />
                      <span className="text-[15.5px]">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Image Collage */}
          <div className="hidden md:grid grid-cols-12 gap-4 items-center">
            <div className="col-span-7">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md border border-slate-200/70 bg-white">
                <Image
                  src="/images/Sektorel_Yazilim_Cozumleri-1-683x1024.webp"
                  alt="Akınsoft Sektörel Yazılım Çözümleri Ana Sayfa 01"
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="col-span-5 flex flex-col gap-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md border border-slate-200/70 bg-white">
                <Image
                  src="/images/Sektorel_Yazilim_Cozumleri-2-1024x683.webp"
                  alt="Akınsoft Sektörel Çözümler 01"
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md border border-slate-200/70 bg-white">
                <Image
                  src="/images/Sektorel_Yazilim_Cozumleri-3-1024x683.webp"
                  alt="Akınsoft Sektörel Çözümler 02"
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: E-Dönüşüm Çözümleri (#e-donusum) */}
      <section id="e-donusum" className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1290px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left 60% (7 cols) */}
          <div className="lg:col-span-7">
            <h3 className="text-[24px] sm:text-[26px] font-bold text-[#060a0d] mb-4">
              E-Dönüşüm Çözümleri
            </h3>
            <p className="text-[16.5px] leading-[1.72] text-[#252424] mb-6">
              <strong>
                <Link
                  href="/akinsoft-e-donusum/"
                  className="text-[#09589a] hover:text-[#0c644e] underline"
                >
                  e-Dönüşüm
                </Link>
              </strong>{' '}
              zorunluluklarını karşılamak için ayrı ayrı yazılım kurmak zorunda
              değilsiniz. Wolvox ERP içindeki{' '}
              <strong>
                e-Fatura, e-Arşiv, e-İrsaliye, e-Defter ve e-Mutabakat
              </strong>{' '}
              modülleriyle tüm yasal yükümlülüklerinizi tek platformdan
              karşılarsınız.
              <br />
              Yeni mükellefiyet mi başladı?{' '}
              <strong>GİB entegrasyonunu</strong> biz kuruyoruz, sizi adım adım
              yönlendiriyoruz.
            </p>

            {/* 3-Column Icon List */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {EDONUSUM_CHECKLIST.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-[#f8fffe] border border-[#0c644e]/20 hover:border-[#09589a] font-semibold text-[#060a0d] hover:text-[#0c644e] transition-colors"
                  >
                    <CheckSquare className="w-5 h-5 text-[#0c644e] shrink-0" />
                    <span className="text-[15px]">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right 40% (5 cols) Rounded 20px Image Card */}
          <div className="lg:col-span-5">
            <div className="relative h-[280px] sm:h-[340px] rounded-[20px] overflow-hidden shadow-md border border-slate-200">
              <Image
                src="/images/akinsoft-e-donusum-03.webp"
                alt="Akınsoft E-Dönüşüm Çözümleri"
                fill
                referrerPolicy="no-referrer"
                className="object-cover object-[54%_10%]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: Güncel Kampanyalar (#akinsoft-kampanyalar) */}
      <section
        id="akinsoft-kampanyalar"
        className="bg-[#eff6ff] py-10 lg:py-12 border-y border-blue-200/60"
      >
        <div className="max-w-[1290px] mx-auto px-6">
          <div className="border-b border-[#1159af] pb-4 mb-6 flex items-center justify-between">
            <Link
              href="/akinsoft-kampanyalar/"
              className="inline-flex items-center gap-2.5 text-[22px] sm:text-[25px] font-bold text-[#0c644e] hover:text-[#09589a] transition-colors group"
            >
              <span>Güncel Kampanyalar</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/akinsoft-kampanyalar/"
              className="text-sm font-semibold text-[#09589a] hover:underline hidden sm:inline"
            >
              Tüm Kampanyaları Gör →
            </Link>
          </div>

          {campaignPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campaignPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.path}/`}
                  className="bg-white rounded-xl border border-blue-100 p-5 shadow-xs hover:shadow-md hover:border-[#09589a] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span>Akınsoft Kampanyalar</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(post.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <h4 className="text-[18px] font-bold text-[#060a0d] group-hover:text-[#09589a] leading-snug mb-2 transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-sm text-[#252424] line-clamp-3 m-0">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0c644e] group-hover:text-[#09589a]">
                    <span>Kampanya Detayı</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 8: About & FAQ Accordion (#akinsoft-sss) */}
      <section id="akinsoft-sss" className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1290px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
          {/* Left Column: About Summary */}
          <div className="bg-[#f7fafc] border border-slate-200/80 rounded-2xl p-6 sm:p-8">
            <p className="text-[16.5px] leading-[1.75] text-[#252424] m-0">
              1989&rsquo;dan bu yana kesintisiz büyüyen{' '}
              <strong>
                <Link
                  href="/"
                  className="text-[#09589a] hover:text-[#0c644e] underline"
                >
                  Akınsoft
                </Link>
              </strong>
              , bugün 150.000&rsquo;den fazla işletmenin ve 2.000&rsquo;i aşkın
              yetkili bayinin güvendiği Türkiye&rsquo;nin köklü yazılım
              markalarından biridir. Muhasebe ve ERP&rsquo;den
              e-Dönüşüm&rsquo;e, restoran yönetiminden imalat takibine kadar
              onlarca sektöre özel çözümüyle her ölçekteki işletmenin iş
              süreçlerini tek platformda buluşturur.
              <br />
              <br />
              Bu güçlü altyapıyı İzmir&rsquo;e ve Türkiye&rsquo;ye taşıyan{' '}
              <strong>Akınsoft Ana Bayi</strong> olarak biz, yalnızca yazılım
              satmıyoruz — doğru ürünü seçmenizden kuruluma, eğitimden yıllara
              uzanan teknik desteğe kadar tüm süreci birlikte yönetiyoruz.
            </p>
          </div>

          {/* Right Column: Interactive Kadence Accordion */}
          <div>
            <HomeFaqAccordion />
          </div>
        </div>
      </section>
    </article>
  );
}
