import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingElements from '@/components/FloatingElements';

const siteUrl = process.env.APP_URL || 'https://www.akinsoftizmir.com.tr';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Akınsoft İzmir Ana Bayi | Muhasebe, ERP Ve E-Dönüşüm',
    template: '%s | Akınsoft İzmir Ana Bayi',
  },
  description:
    'Akınsoft İzmir Ana Bayi: Wolvox ERP, muhasebe programları ve e-Dönüşüm için 200+ aktif müşteriye hizmet veriyoruz. 10+ yıl tecrübe, Ücretsiz demo.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Akınsoft İzmir Ana Bayi | Muhasebe, ERP Ve E-Dönüşüm',
    description:
      'Akınsoft İzmir Ana Bayi: Wolvox ERP, muhasebe programları ve e-Dönüşüm için 200+ aktif müşteriye hizmet veriyoruz. 10+ yıl tecrübe, Ücretsiz demo.',
    url: siteUrl,
    siteName: 'Akınsoft İzmir Ana Bayi',
    locale: 'tr_TR',
    type: 'website',
    images: [
      {
        url: '/images/akinsoft-logo-kare-ba35022.webp',
        width: 512,
        height: 512,
        alt: 'Akınsoft İzmir Ana Bayi BA35022',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Akınsoft İzmir Ana Bayi | Muhasebe, ERP Ve E-Dönüşüm',
    description:
      'Akınsoft İzmir Ana Bayi: Wolvox ERP, muhasebe programları ve e-Dönüşüm için 200+ aktif müşteriye hizmet veriyoruz. 10+ yıl tecrübe, Ücretsiz demo.',
    images: ['/images/akinsoft-logo-kare-ba35022.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': `${siteUrl}/#localbusiness`,
      name: 'Akınsoft İzmir Ana Bayi - Dijital Evre (BA35022)',
      image: `${siteUrl}/images/akinsoft-logo-kare-ba35022.webp`,
      url: siteUrl,
      telephone: '+902324251988',
      email: 'bilgi@akinsoftizmir.com.tr',
      priceRange: '₺₺',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Muciburrahman Sk. No:3/522',
        addressLocality: 'Konak',
        addressRegion: 'İzmir',
        postalCode: '35250',
        addressCountry: 'TR',
      },
      description:
        'Akınsoft İzmir Ana Bayi (BA35022): Wolvox ERP, muhasebe programları, OctoCloud ve e-Dönüşüm çözümlerinin satış, kurulum, eğitim ve teknik destek merkezi.',
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Neden Akınsoft ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "İzmir'de başka Akınsoft bayisi de var. Bizi farklı kılan, yazılımı satıp gitmiyoruz. 200'den fazla aktif müşterimiz, sorularını bize telefon ya da WhatsApp ile ilettiğinde 4 iş saati içinde yanıt alıyor. Resmi bayi kodumuzu (BA35022) taşıyan, Akınsoft tarafından 'Ana Bayi ve Çözüm Ortağı' olarak tescillenmiş İzmir noktasıyız.",
          },
        },
        {
          '@type': 'Question',
          name: 'Akınsoft Nedir ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Akınsoft, 1989'dan bu yana Türkiye'de faaliyet gösteren yerli yazılım şirketidir. ERP, muhasebe, e-Dönüşüm ve sektörel yazılım alanlarında 150.000'den fazla işletmeye hizmet veren Akınsoft; restoran, otel, market, imalat, inşaat ve hizmet sektörlerine özel modülleriyle Türkiye'nin en köklü yazılım markalarından biri konumundadır.",
          },
        },
        {
          '@type': 'Question',
          name: 'Akınsoft İzmir Ana Bayi olarak hangi hizmetleri sunuyorsunuz?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "ERP, muhasebe yazılımları, e-Dönüşüm ve sektörel programların satış, kurulum, eğitim ve teknik destek hizmetlerini sunuyoruz. İzmir'de yerinde, Türkiye genelinde uzaktan hizmet veriyoruz. Resmi Bayi Kodumuzu (BA35022) taşıyan yetkili adresiz.",
          },
        },
        {
          '@type': 'Question',
          name: 'Demo kurulumu ücretsiz mi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Evet. Wolvox ERP, OctoCloud ve tüm sektörel yazılımların 30 günlük ücretsiz deneme sürümünü kuruyoruz. İzmir'de yerinde veya uzaktan bağlantıyla kurulum yapıyoruz.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="stylesheet" href="/kadence-blocks.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <FloatingElements />
      </body>
    </html>
  );
}
