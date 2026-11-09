import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  ChevronRight,
  Phone,
  Monitor,
  Calendar,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  findContentByPath,
  getAllPosts,
  getAllPrompts,
  getPostsByCategory,
  WpPageItem,
  WpPostItem,
  WpPromptItem,
  WpCategoryItem,
} from '@/lib/wp-data';
import {
  KdvCalculatorWidget,
  InteractiveLeadFormWidget,
} from '@/components/InteractivePageTools';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const rawPath = slug.join('/');

  if (rawPath === 'blog') {
    return {
      title: 'Blog - Makaleler, Kampanyalar ve Bilgi Bankası',
      description:
        'Akınsoft İzmir Ana Bayi Blog: ERP, ön muhasebe, e-Fatura, restoran otomasyonu, sektörel yazılımlar ve güncel kampanyalar hakkında uzman rehberler.',
      alternates: { canonical: '/blog/' },
    };
  }

  if (rawPath === 'ai-prompts') {
    return {
      title: 'İşletmeler ve Muhasebe İçin AI Prompts Kütüphanesi',
      description:
        'Akınsoft İzmir Ana Bayi tarafından hazırlanan kurumsal yönetim, muhasebe, finans ve e-ticaret yapay zeka komutları (AI Prompts).',
      alternates: { canonical: '/ai-prompts/' },
    };
  }

  const found = findContentByPath(rawPath);
  if (!found) {
    return {
      title: 'Sayfa Bulunamadı',
    };
  }

  if (found.type === 'category') {
    const cat = found.item as WpCategoryItem;
    return {
      title: `${cat.name} | Akınsoft İzmir Ana Bayi`,
      description: cat.description || `${cat.name} kategorisindeki güncel içerikler.`,
      alternates: { canonical: `/${cat.slug}/` },
    };
  }

  const item = found.item as WpPageItem | WpPostItem | WpPromptItem;
  return {
    title: item.title,
    description: item.excerpt,
    alternates: { canonical: `/${item.path}/` },
    openGraph: {
      title: `${item.title} | Akınsoft İzmir Ana Bayi`,
      description: item.excerpt,
      url: `/${item.path}/`,
      type: found.type === 'post' ? 'article' : 'website',
      images: item.image ? [{ url: item.image }] : undefined,
    },
  };
}

export default async function DynamicContentPage({ params }: PageProps) {
  const { slug } = await params;
  const rawPath = slug.join('/').toLowerCase();

  // Special Archive: /blog/
  if (rawPath === 'blog') {
    const posts = getAllPosts();
    return (
      <main className="py-10 lg:py-14 bg-[#f7fafc]">
        <div className="max-w-[1290px] mx-auto px-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-[#0c644e]">
              Ana Sayfa
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#060a0d] font-semibold">Blog</span>
          </nav>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#060a0d] mb-3">
              Akınsoft İzmir Blog & Bilgi Merkezi
            </h1>
            <p className="text-base text-[#252424] max-w-3xl m-0">
              ERP, e-Dönüşüm, ön muhasebe, sektörel yazılımlar, güncel Akınsoft
              kampanyaları ve adım adım teknik çözüm rehberleri.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-slate-100">
              <Link
                href="/makaleler/"
                className="px-4 py-2 rounded-lg bg-[#f8fffe] border border-[#0c644e]/30 text-sm font-semibold text-[#0c644e] hover:bg-[#0c644e] hover:text-white transition-colors"
              >
                Makaleler
              </Link>
              <Link
                href="/akinsoft-kampanyalar/"
                className="px-4 py-2 rounded-lg bg-[#f8fffe] border border-[#0c644e]/30 text-sm font-semibold text-[#0c644e] hover:bg-[#0c644e] hover:text-white transition-colors"
              >
                Akınsoft Kampanyalar
              </Link>
              <Link
                href="/bilgi-bankasi/"
                className="px-4 py-2 rounded-lg bg-[#f8fffe] border border-[#0c644e]/30 text-sm font-semibold text-[#0c644e] hover:bg-[#0c644e] hover:text-white transition-colors"
              >
                Bilgi Bankası
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.path}/`}
                className="bg-white rounded-xl border border-slate-200/80 p-6 hover:border-[#09589a] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-[#0c644e]" />
                    <span>
                      {new Date(post.date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <h2 className="text-[19px] font-bold text-[#060a0d] group-hover:text-[#09589a] leading-snug mb-2.5 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-[#252424] line-clamp-3 m-0">
                    {post.excerpt}
                  </p>
                </div>
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0c644e] group-hover:text-[#09589a]">
                  <span>Devamını Oku</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Special Archive: /ai-prompts/
  if (rawPath === 'ai-prompts') {
    const prompts = getAllPrompts();
    return (
      <main className="py-10 lg:py-14 bg-[#f7fafc]">
        <div className="max-w-[1290px] mx-auto px-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-[#0c644e]">
              Ana Sayfa
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#060a0d] font-semibold">AI Prompts</span>
          </nav>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#060a0d] mb-3">
              AI Prompts — İşletme ve Finans Yapay Zeka Şablonları
            </h1>
            <p className="text-base text-[#252424] max-w-3xl m-0">
              İş süreçlerinizi hızlandırmak, finansal analizlerinizi ve kurumsal
              raporlamalarınızı güçlendirmek için hazır yapay zeka komutları.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map((item) => (
              <Link
                key={item.id}
                href={`/${item.path}/`}
                className="bg-white rounded-xl border border-slate-200/80 p-6 hover:border-[#09589a] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#09589a] font-semibold mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>AI Prompt Şablonu</span>
                  </div>
                  <h2 className="text-[19px] font-bold text-[#060a0d] group-hover:text-[#0c644e] leading-snug mb-2.5 transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-sm text-[#252424] line-clamp-3 m-0">
                    {item.excerpt}
                  </p>
                </div>
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0c644e]">
                  <span>İncele ve Kopyala</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const found = findContentByPath(rawPath);
  if (!found) {
    notFound();
  }

  // Category Archive View (e.g., /akinsoft-kampanyalar/, /bilgi-bankasi/, /makaleler/, /duyurular/)
  if (found.type === 'category') {
    const cat = found.item as WpCategoryItem;
    const catPosts = getPostsByCategory(cat.id);

    return (
      <main className="py-10 lg:py-14 bg-[#f7fafc]">
        <div className="max-w-[1290px] mx-auto px-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-[#0c644e]">
              Ana Sayfa
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/blog/" className="hover:text-[#0c644e]">
              Blog
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#060a0d] font-semibold">{cat.name}</span>
          </nav>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#060a0d] mb-3">
              {cat.name}
            </h1>
            {cat.description && (
              <p className="text-base text-[#252424] max-w-4xl m-0">
                {cat.description}
              </p>
            )}
          </div>

          {catPosts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-base text-slate-600 mb-4">
                Bu kategoride henüz yeni bir duyuru bulunmamaktadır. Güncel
                yazılım çözümlerimiz ve kampanyalarımız için bizimle iletişime
                geçebilirsiniz.
              </p>
              <Link
                href="/akinsoft-demo-talebi/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0c644e] text-white font-semibold rounded-lg hover:bg-[#09589a]"
              >
                Ücretsiz Demo Talebi
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.path}/`}
                  className="bg-white rounded-xl border border-slate-200/80 p-6 hover:border-[#09589a] hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5 tabular-nums">
                      <span>{cat.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {new Date(post.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <h2 className="text-[19px] font-bold text-[#060a0d] group-hover:text-[#09589a] leading-snug mb-2.5 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-[#252424] line-clamp-3 m-0">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0c644e] group-hover:text-[#09589a]">
                    <span>İçeriği İncele</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Individual Page, Post, or AI Prompt View
  const item = found.item as WpPageItem | WpPostItem | WpPromptItem;
  const hasH1InContent = /<h1[\s>]/i.test(item.content);
  const slugName = item.slug.toLowerCase();

  return (
    <main className="py-8 lg:py-12 bg-white">
      <div className="max-w-[1290px] mx-auto px-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-6 pb-3 border-b border-slate-100"
        >
          <Link href="/" className="hover:text-[#0c644e] font-medium">
            Akınsoft İzmir Ana Bayi
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          {found.type === 'post' && (
            <>
              <Link href="/blog/" className="hover:text-[#0c644e] font-medium">
                Blog
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </>
          )}
          {found.type === 'prompt' && (
            <>
              <Link
                href="/ai-prompts/"
                className="hover:text-[#0c644e] font-medium"
              >
                AI Prompts
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </>
          )}
          <span className="text-[#060a0d] font-semibold truncate max-w-md">
            {item.title}
          </span>
        </nav>

        {/* Render Page Header if H1 is not already inside the Kadence content */}
        {!hasH1InContent && (
          <header className="mb-8 bg-[#f7fafc] border border-slate-200/70 rounded-2xl p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#09589a] leading-tight m-0">
              {item.title}
            </h1>
            {'date' in item && item.date && (
              <div className="mt-2.5 text-xs text-slate-500 tabular-nums">
                Yayın Tarihi: {new Date(item.date).toLocaleDateString('tr-TR')} ·
                Akınsoft İzmir Ana Bayi (BA35022)
              </div>
            )}
          </header>
        )}

        {/* Special Interactive Tool Injections for Tool/Form Pages */}
        {slugName === 'kdv-hesaplama-araci' && <KdvCalculatorWidget />}
        {slugName === 'akinsoft-demo-talebi' && (
          <InteractiveLeadFormWidget mode="demo" />
        )}
        {slugName === 'akinsoft-destek' && (
          <InteractiveLeadFormWidget mode="destek" />
        )}
        {slugName === 'iletisim' && (
          <InteractiveLeadFormWidget mode="iletisim" />
        )}
        {slugName === 'online-lisans-kontrol' && (
          <InteractiveLeadFormWidget mode="lisans" />
        )}

        {/* Full Authentic WordPress Kadence Content */}
        <article
          className="kadence-content-area"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />

        {/* Bottom CTA Strip on All Subpages */}
        <section className="mt-12 pt-8 border-t border-slate-200">
          <div className="bg-[#0b4b8a] rounded-xl shadow-md px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-6 text-white">
              <p className="text-lg sm:text-xl font-bold m-0">
                {item.title} Hakkında Bilgi ve Ücretsiz Demo
              </p>
              <p className="text-sm sm:text-base text-white/90 m-0 mt-1">
                Akınsoft İzmir Ana Bayi (BA35022) güvencesiyle 30 gün ücretsiz
                deneyin veya uzmanlarımızdan hemen bilgi alın.
              </p>
            </div>
            <div className="lg:col-span-3">
              <Link
                href="/akinsoft-demo-talebi/"
                className="flex items-center gap-3 border-2 border-white rounded-xl px-3.5 py-2.5 text-white hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-white text-[#0c644e] flex items-center justify-center shrink-0">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-base font-bold leading-tight">
                    ÜCRETSİZ
                  </div>
                  <div className="text-sm font-semibold">Demo kurulumu</div>
                </div>
              </Link>
            </div>
            <div className="lg:col-span-3">
              <a
                href="tel:+902324251988"
                className="flex items-center gap-3 border-2 border-white rounded-xl px-3.5 py-2.5 text-white hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-white text-[#0c644e] flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-base font-bold leading-tight">
                    HEMEN ARA
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    0 232 425 19 88
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
