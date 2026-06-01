const MONTH_NAMES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

export function formatReviewMonthYear(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatRatingDisplay(averageRating: number): string {
  return averageRating.toFixed(1).replace('.', ',');
}
