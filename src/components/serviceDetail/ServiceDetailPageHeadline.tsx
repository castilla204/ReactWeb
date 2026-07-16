import React from 'react';

import { Star } from 'lucide-react';



interface ServiceDetailPageHeadlineProps {

  title: string;

  /** @deprecated Usar locationLabel + rating + reviewCount */

  meta?: string | null;

  locationLabel?: string | null;

  rating?: number;

  reviewCount?: number;

  /** on-image = overlay sobre la foto principal (desktop) */

  variant?: 'default' | 'on-image' | 'compact';

  /** Al pulsar rating/reseñas (p. ej. abrir drawer en desktop) */

  onReviewsClick?: () => void;

  className?: string;

}



const ON_IMAGE_META_SHADOW = '[text-shadow:0_1px_3px_rgba(0,0,0,0.55)]';



function ReviewsMeta({

  onImage,

  locationLabel,

  ratingLabel,

  reviewCount,

  hasReviewsLink,

  onReviewsClick,

  compact,

}: {

  onImage: boolean;

  locationLabel?: string | null;

  ratingLabel: string | null;

  reviewCount?: number;

  hasReviewsLink: boolean;

  onReviewsClick?: () => void;

  compact?: boolean;

}) {

  const hasStructuredMeta =

    Boolean(locationLabel) ||

    Boolean(ratingLabel) ||

    (reviewCount != null && reviewCount > 0);



  if (!hasStructuredMeta) return null;



  const metaClass = compact

    ? 'mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-4 text-ink-muted'

    : onImage

      ? `mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm leading-5 text-white ${ON_IMAGE_META_SHADOW}`

      : 'mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm leading-5 text-ink-muted';



  const dotClass = onImage ? 'text-white/70' : 'text-line';

  const reviewsUnderline = onImage

    ? 'underline decoration-white/80 underline-offset-2'

    : 'underline decoration-line underline-offset-2';



  return (

    <p className={metaClass}>

      {locationLabel ? <span>{locationLabel}</span> : null}

      {locationLabel && (ratingLabel || reviewCount) ? (

        <span className={dotClass} aria-hidden>

          ·

        </span>

      ) : null}

      {hasReviewsLink ? (

        <button

          type="button"

          onClick={onReviewsClick}

          className={`sd-host-interactive inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 border-none bg-transparent p-0 font-inherit transition-opacity hover:opacity-80 ${

            onImage ? `text-white ${ON_IMAGE_META_SHADOW}` : 'text-ink-muted'

          }`}

          aria-label={`Ver ${reviewCount} ${reviewCount === 1 ? 'reseña' : 'reseñas'}`}

        >

          {ratingLabel ? (

            <span

              className={

                onImage

                  ? 'inline-flex items-center gap-1 font-medium text-white'

                  : 'inline-flex items-center gap-1 font-medium text-ink'

              }

            >

              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden />

              {ratingLabel}

            </span>

          ) : null}

          {reviewCount != null && reviewCount > 0 ? (

            <>

              {ratingLabel ? (

                <span className={dotClass} aria-hidden>

                  ·

                </span>

              ) : null}

              <span className={reviewsUnderline}>

                {reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}

              </span>

            </>

          ) : null}

        </button>

      ) : (

        <>

          {ratingLabel ? (

            <span

              className={

                onImage

                  ? 'inline-flex items-center gap-1 font-medium text-white'

                  : 'inline-flex items-center gap-1 font-medium text-ink'

              }

            >

              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden />

              {ratingLabel}

            </span>

          ) : null}

          {reviewCount != null && reviewCount > 0 ? (

            <>

              {ratingLabel ? (

                <span className={dotClass} aria-hidden>

                  ·

                </span>

              ) : null}

              <span>

                {reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}

              </span>

            </>

          ) : null}

        </>

      )}

    </p>

  );

}



export const ServiceDetailPageHeadline: React.FC<ServiceDetailPageHeadlineProps> = ({

  title,

  meta,

  locationLabel,

  rating,

  reviewCount,

  variant = 'default',

  onReviewsClick,

  className = '',

}) => {

  const onImage = variant === 'on-image';

  const isCompact = variant === 'compact';

  const hasReviewsLink = Boolean(onReviewsClick) && reviewCount != null && reviewCount > 0;



  const ratingLabel =

    rating != null && rating > 0 ? Number(rating).toFixed(1).replace(/\.0$/, '') : null;



  return (

    <header className={`${className} ${isCompact ? 'min-w-0' : ''}`.trim()}>

      {isCompact ? (

        <>

          <h1 className="sd-page-title-compact m-0 text-xl font-semibold leading-[1.15] tracking-[-0.02em] text-ink-strong">
            <span className="sd-page-title-compact__title">{title}</span>
            {locationLabel ? (
              <>
                <span className="sd-page-title-compact__sep" aria-hidden>
                  ·
                </span>
                <span
                  className="sd-page-title-compact__location font-normal text-ink-muted"
                  title={locationLabel}
                >
                  {locationLabel}
                </span>
              </>
            ) : null}
          </h1>

          <ReviewsMeta

            compact

            onImage={false}

            locationLabel={null}

            ratingLabel={ratingLabel}

            reviewCount={reviewCount}

            hasReviewsLink={hasReviewsLink}

            onReviewsClick={onReviewsClick}

          />

        </>

      ) : (

        <>

          <h1

            className={

              onImage

                ? `font-display text-xl font-semibold tracking-[-0.02em] text-white md:text-headline lg:leading-[1.25] ${ON_IMAGE_META_SHADOW}`

                : 'sd-page-title'

            }

          >

            {title}

          </h1>

          <ReviewsMeta

            onImage={onImage}

            locationLabel={locationLabel}

            ratingLabel={ratingLabel}

            reviewCount={reviewCount}

            hasReviewsLink={hasReviewsLink}

            onReviewsClick={onReviewsClick}

          />

          {!locationLabel && !ratingLabel && !(reviewCount != null && reviewCount > 0) && meta ? (

            <p

              className={

                onImage

                  ? `mt-2 text-sm leading-snug text-white ${ON_IMAGE_META_SHADOW}`

                  : 'mt-2 text-sm leading-snug text-ink-muted'

              }

            >

              {meta}

            </p>

          ) : null}

        </>

      )}

    </header>

  );

};


