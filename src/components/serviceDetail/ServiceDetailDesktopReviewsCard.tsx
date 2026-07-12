import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ServiceReviewItem } from './ServiceDetailReviewsSection';
import { ServiceDetailReviewStars } from './ServiceDetailReviewStars';
import { formatRatingDisplay } from '../../utils/reviewFormat';
import { pickPreviewReviews } from '../../utils/reviewRatingDistribution';
import { cn } from '../../lib/utils';

export type ServiceDetailReviewsCardLayout = 'sidebar' | 'mobile';

export interface ServiceDetailDesktopReviewsCardProps {
    reviews: ServiceReviewItem[];
    averageRating: number;
    onShowAll: () => void;
    className?: string;
    /** sidebar = columna desktop; mobile = tab a ancho completo. */
    layout?: ServiceDetailReviewsCardLayout;
}

/** Tarjeta de reseñas — paridad visual con sd-deliverable-cover. */
export function ServiceDetailDesktopReviewsCard({
    reviews,
    averageRating,
    onShowAll,
    className = '',
    layout = 'sidebar',
}: ServiceDetailDesktopReviewsCardProps) {
    const isMobile = layout === 'mobile';
    const featuredReview = useMemo(() => pickPreviewReviews(reviews, 1)[0], [reviews]);
    const ratingLabel = formatRatingDisplay(averageRating);
    const countLabel =
        reviews.length === 1 ? '1 opinión verificada' : `${reviews.length} opiniones verificadas`;

    const featuredText = (
        featuredReview?.description ||
        featuredReview?.comment ||
        ''
    ).trim();
    const featuredName = featuredReview?.client?.name?.trim() || 'Cliente';

    const cardClass = cn(
        'sd-reviews-highlight-card group flex min-h-0 flex-col overflow-hidden border border-ink-strong bg-white',
        isMobile
            ? 'sd-reviews-highlight-card--mobile w-full rounded-2xl'
            : 'sd-reviews-sidebar-card h-full w-[15.5rem] max-w-full',
        className,
    );

    if (reviews.length === 0) {
        return (
            <div className={cn(cardClass, isMobile ? 'px-4 py-5' : 'min-h-[8rem] justify-center px-4 py-5')}>
                <p className="text-meta leading-snug text-ink-muted">
                    Aún no hay valoraciones para este servicio.
                </p>
            </div>
        );
    }

    return (
        <div className={cardClass}>
            <div
                className={cn(
                    'sd-reviews-highlight-card__head shrink-0 border-b border-line-soft bg-surface-tinted',
                    isMobile ? 'px-4 py-3 text-left' : 'px-4 py-4 text-center',
                )}
            >
                <p
                    className={cn(
                        'sd-rating-numeral leading-none',
                        isMobile ? 'text-[1.875rem] md:text-[1.875rem]' : 'text-[2rem] md:text-[2rem]',
                    )}
                >
                    {ratingLabel}
                </p>
                <ServiceDetailReviewStars
                    rating={averageRating}
                    size={isMobile ? 'sm' : 'md'}
                    className={cn('mt-1.5', !isMobile && 'justify-center')}
                />
                <p className="mt-1 text-caption leading-snug text-ink-muted">{countLabel}</p>
            </div>

            <div className="flex min-h-0 flex-col">
                {featuredText ? (
                    <blockquote
                        className={cn(
                            'sd-reviews-highlight-card__quote min-h-0 text-left',
                            isMobile ? 'm-0 px-4 py-2.5' : 'flex-1 overflow-hidden px-4 pb-2 pt-3',
                        )}
                    >
                        <p
                            className={cn(
                                'text-sm leading-[1.65] text-ink-muted',
                                isMobile ? 'line-clamp-4 [text-wrap:pretty]' : 'line-clamp-4 text-meta leading-snug',
                            )}
                        >
                            &ldquo;{featuredText}&rdquo;
                        </p>
                    </blockquote>
                ) : (
                    <div
                        className={cn('min-h-0', isMobile ? 'px-4 py-3' : 'flex-1 px-4 pt-3')}
                        aria-hidden
                    />
                )}

                <div className="mt-auto shrink-0 border-t border-line-soft">
                    <button
                        type="button"
                        onClick={onShowAll}
                        className="sd-host-interactive sd-reviews-highlight-card__footer flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-tinted/60"
                    >
                        <span className="min-w-0 truncate text-meta text-ink-strong">{featuredName}</span>
                        <span className="inline-flex shrink-0 items-center gap-0.5 text-meta font-semibold text-[hsl(var(--brand))]">
                            Ver todas
                            <ChevronRight
                                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                                aria-hidden
                            />
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
