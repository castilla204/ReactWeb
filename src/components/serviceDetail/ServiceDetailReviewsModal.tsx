import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { computeReviewRatingDistribution } from '../../utils/reviewRatingDistribution';
import { formatRatingDisplay } from '../../utils/reviewFormat';
import { ServiceDetailReviewStars } from './ServiceDetailReviewStars';
import { ServiceDetailReviewHistogram } from './ServiceDetailReviewHistogram';
import { ResponsiveModal } from '../ui/responsive-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog';
import { useWindowSize } from '../../hooks/useWindowSize';
import {
  ServiceDetailReviewsSection,
  type ServiceReviewItem,
} from './ServiceDetailReviewsSection';

interface ServiceDetailReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviews: ServiceReviewItem[];
  averageRating: number;
  expertName?: string;
  expandedReviews: Record<string | number, boolean>;
  onToggleExpand: (key: string | number) => void;
  onOpenReviewImage?: (reviewKey: string | number, imageIndex: number) => void;
}

function ReviewsSummaryBar({
  averageRating,
  reviewCount,
  reviews,
}: {
  averageRating: number;
  reviewCount: number;
  reviews: ServiceReviewItem[];
}) {
  const display = formatRatingDisplay(averageRating);
  const distribution = useMemo(() => computeReviewRatingDistribution(reviews), [reviews]);
  const showBars = reviewCount >= 3;

  return (
    <div className="shrink-0 border-b border-[#e8e8e8] bg-[#fafafa] px-5 py-3.5">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <p className="text-2xl font-semibold tabular-nums leading-none tracking-tight text-[#1c1c1c]">
            {display}
          </p>
          <ServiceDetailReviewStars rating={averageRating} size="md" className="mt-1" />
          <p className="mt-1 text-xs text-[#6a6a6a]">
            {reviewCount === 1 ? '1 opinión verificada' : `${reviewCount} opiniones verificadas`}
          </p>
        </div>

        {showBars ? (
          <div className="min-w-0 flex-1 pt-0.5">
            <ServiceDetailReviewHistogram
              distribution={distribution}
              total={reviewCount}
              compact
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReviewsListBody({
  reviews,
  averageRating,
  expandedReviews,
  onToggleExpand,
  onOpenReviewImage,
}: Pick<
  ServiceDetailReviewsModalProps,
  'reviews' | 'averageRating' | 'expandedReviews' | 'onToggleExpand' | 'onOpenReviewImage'
>) {
  return (
    <ServiceDetailReviewsSection
      reviews={reviews}
      averageRating={averageRating}
      expandedReviews={expandedReviews}
      onToggleExpand={onToggleExpand}
      onOpenReviewImage={onOpenReviewImage}
      hideHeading
      headingId="sd-reviews-modal-heading"
      density="compact"
      className="!mt-0 !border-t-0 !pt-0"
    />
  );
}

/** Desktop: panel lateral. Móvil: drawer. */
export const ServiceDetailReviewsModal: React.FC<ServiceDetailReviewsModalProps> = ({
  open,
  onOpenChange,
  reviews,
  averageRating,
  expertName,
  expandedReviews,
  onToggleExpand,
  onOpenReviewImage,
}) => {
  const { width } = useWindowSize();
  const isMobile = width > 0 ? width < 1024 : false;

  if (isMobile) {
    return (
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        title="Reseñas"
        description={
          expertName
            ? `Opiniones sobre ${expertName}`
            : 'Opiniones de clientes verificadas'
        }
        drawerMaxHeight="min(90dvh, calc(100dvh - env(safe-area-inset-bottom)))"
        snapPoints={[0.9]}
        dialogHeaderClassName="border-[#e8e8e8] bg-white px-4 pb-2.5 pt-3.5"
        dialogClassName="md:!max-w-[520px] rounded-xl border border-[#e8e8e8] shadow-[0_12px_48px_rgba(0,0,0,0.14)]"
      >
        <ReviewsSummaryBar
          averageRating={averageRating}
          reviewCount={reviews.length}
          reviews={reviews}
        />
        <div className="px-4 pb-5 pt-2">
          <ReviewsListBody
            reviews={reviews}
            averageRating={averageRating}
            expandedReviews={expandedReviews}
            onToggleExpand={onToggleExpand}
            onOpenReviewImage={onOpenReviewImage}
          />
        </div>
      </ResponsiveModal>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        overlayClassName="bg-black/40"
        className="fixed right-0 top-0 z-50 flex h-full max-h-[100dvh] w-full max-w-[min(480px,100vw)] flex-col gap-0 overflow-hidden border-0 border-l border-[#ebebeb] bg-white p-0 shadow-[-16px_0_48px_rgba(15,23,42,0.12)] duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-[480px] !left-auto !right-0 !top-0 !h-full !max-h-[100dvh] !w-full !translate-x-0 !translate-y-0 !rounded-none"
      >
        <DialogTitle className="sr-only">Reseñas</DialogTitle>
        <DialogDescription className="sr-only">
          {reviews.length} opiniones de clientes
        </DialogDescription>

        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#ebebeb] bg-white px-5">
          <div className="min-w-0 pr-3">
            <p className="truncate text-base font-semibold leading-tight text-[#1c1c1c]">Reseñas</p>
            {expertName ? (
              <p className="truncate text-xs text-[#6a6a6a]">{expertName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#717171] transition-colors hover:bg-[#f5f5f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1c1c]"
            aria-label="Cerrar reseñas"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {reviews.length > 0 ? (
          <ReviewsSummaryBar
          averageRating={averageRating}
          reviewCount={reviews.length}
          reviews={reviews}
        />
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-6 pt-3">
          <ReviewsListBody
            reviews={reviews}
            averageRating={averageRating}
            expandedReviews={expandedReviews}
            onToggleExpand={onToggleExpand}
            onOpenReviewImage={onOpenReviewImage}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
