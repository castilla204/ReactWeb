import type { ServiceReviewItem } from '../components/serviceDetail/ServiceDetailReviewsSection';

const STAR_LEVELS = [5, 4, 3, 2, 1] as const;

export function getReviewStarRating(review: ServiceReviewItem): number {
  const raw = review.rating ?? review.score ?? 5;
  return Math.min(5, Math.max(1, Math.round(raw)));
}

export type ReviewRatingBucket = {
  star: (typeof STAR_LEVELS)[number];
  count: number;
  percent: number;
};

export function computeReviewRatingDistribution(
  reviews: ServiceReviewItem[],
): ReviewRatingBucket[] {
  const total = reviews.length;
  if (total === 0) {
    return STAR_LEVELS.map((star) => ({ star, count: 0, percent: 0 }));
  }

  const counts = new Map<number, number>();
  for (const review of reviews) {
    const star = getReviewStarRating(review);
    counts.set(star, (counts.get(star) ?? 0) + 1);
  }

  return STAR_LEVELS.map((star) => {
    const count = counts.get(star) ?? 0;
    return { star, count, percent: Math.round((count / total) * 100) };
  });
}

/** Reseñas representativas: recientes + la más extensa, hasta `count`. */
export function pickPreviewReviews(
  reviews: ServiceReviewItem[],
  count = 2,
): ServiceReviewItem[] {
  const withText = reviews.filter((r) => (r.description || r.comment || '').trim().length > 0);
  if (withText.length === 0) return [];
  if (withText.length <= count) return withText;

  const byDate = [...withText].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const longest = [...withText].sort((a, b) => {
    const lenA = (a.description || a.comment || '').length;
    const lenB = (b.description || b.comment || '').length;
    return lenB - lenA;
  })[0];

  const picked: ServiceReviewItem[] = [];
  const seen = new Set<string>();
  const add = (review: ServiceReviewItem) => {
    const key = String(review.id ?? review.createdAt);
    if (seen.has(key)) return;
    seen.add(key);
    picked.push(review);
  };

  add(byDate[0]);
  add(longest);
  for (const review of byDate) {
    if (picked.length >= count) break;
    add(review);
  }

  return picked.slice(0, count);
}
