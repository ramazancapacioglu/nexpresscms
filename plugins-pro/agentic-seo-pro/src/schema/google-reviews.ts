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

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

/**
 * LocalBusiness düğümüne yalnız girilmiş puan ve yorumları ekler. Boş ayarda örnek isim basılmaz.
 */
export function enrichWithGoogleReviews(
  node: SchemaGraphNode,
  settings?: GoogleReviewsSettings
): SchemaGraphNode {
  const ratingValue = asNumber(settings?.googleRating);
  const reviewCount = asNumber(settings?.googleReviewCount);
  const rawReviews = Array.isArray(settings?.reviews) ? settings.reviews : [];
  if (ratingValue === null && rawReviews.length === 0) return node;
  const minFilter = asNumber(settings?.minRatingFilter) ?? 1;

  const filteredReviews = rawReviews.filter((r) => r.rating >= minFilter);

  const aggregateRating = ratingValue === null
    ? undefined
    : {
        "@type": "AggregateRating",
        ratingValue,
        reviewCount: reviewCount ?? filteredReviews.length,
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
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(reviewNodes.length > 0 ? { review: reviewNodes } : {}),
  };
}

