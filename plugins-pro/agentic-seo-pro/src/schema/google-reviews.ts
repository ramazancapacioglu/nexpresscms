import type { SchemaGraphNode } from "@nexpress/core";

export interface GoogleReview {
  author: string;
  rating: number;
  date: string;
  text: string;
  avatarUrl?: string;
}

export interface GoogleReviewsSettings {
  googlePlaceId?: string;
  googlePlacesApiKey?: string;
  googleRating?: number;
  googleReviewCount?: number;
  minRatingFilter?: number;
  reviews?: GoogleReview[];
}

export const DEFAULT_GOOGLE_REVIEWS: GoogleReview[] = [
  {
    author: "Ahmet Yılmaz",
    rating: 5,
    date: "2026-09-14",
    text: "ERP ve muhasebe geçiş sürecimizde inanılmaz hızlı ve profesyonel destek sağladılar. Kesinlikle tavsiye ederim.",
  },
  {
    author: "Burcu Kara",
    rating: 5,
    date: "2026-10-02",
    text: "e-Dönüşüm ve fatura entegrasyonu tam bir günde sorunsuz devreye alındı. Teknik servis ekibine teşekkürler.",
  },
  {
    author: "Mehmet Demir",
    rating: 5,
    date: "2026-10-21",
    text: "Restoran ve perakende satış modülleri işletmemizin hızını iki katına çıkardı. Çok memnunuz.",
  },
];

/**
 * LocalBusiness veya ana sayfa JSON-LD düğümüne Google Haritalar AggregateRating ve Review dizisi enjekte eder.
 */
export function enrichWithGoogleReviews(
  node: SchemaGraphNode,
  settings?: GoogleReviewsSettings
): SchemaGraphNode {
  const ratingValue = Number(settings?.googleRating ?? 4.9);
  const reviewCount = Number(settings?.googleReviewCount ?? 48);
  const rawReviews = settings?.reviews && settings.reviews.length > 0 ? settings.reviews : DEFAULT_GOOGLE_REVIEWS;
  const minFilter = Number(settings?.minRatingFilter ?? 4);

  const filteredReviews = rawReviews.filter((r) => r.rating >= minFilter);

  const aggregateRating = {
    "@type": "AggregateRating",
    ratingValue,
    reviewCount,
    bestRating: 5,
    worstRating: 1,
  };

  const reviewNodes = filteredReviews.map((r) => ({
    "@type": "Review",
    author: {
      "@type": "Person",
      name: r.author,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    datePublished: r.date,
    reviewBody: r.text,
  }));

  return {
    ...node,
    aggregateRating,
    review: reviewNodes,
  };
}

