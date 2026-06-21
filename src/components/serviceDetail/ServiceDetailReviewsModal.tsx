import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { computeReviewRatingDistribution } from '../../utils/reviewRatingDistribution';
import { ServiceDetailReviewsMobileStatsRow } from './ServiceDetailReviewsMobileStatsRow';
import { ResponsiveModal } from '../ui/responsive-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog';
import { useWindowSize } from '../../hooks/useWindowSize';
import { SD_MOBILE_GUTTER_CLASS } from '../../constants/homepageTypography';
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

const DESKTOP_REVIEWS_PANEL_CLASS =
  'fixed right-0 top-0 z-50 flex h-full max-h-[100dvh] w-full max-w-[min(480px,100vw)] flex-col gap-0 overflow-hidden border-0 border-l border-[#ebebeb] bg-white p-0 shadow-[-16px_0_48px_rgba(15,23,42,0.12)] duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-[480px] !left-auto !right-0 !top-0 !h-full !max-h-[100dvh] !w-full !translate-x-0 !translate-y-0 !rounded-none';

function ReviewsDrawerHeader({
  expertName,
  reviewCount,
  onClose,
  layout,
}: {
  expertName?: string;
  reviewCount: number;
  onClose: () => void;
  layout: 'mobile' | 'desktop';
}) {
  const isDesktop = layout === 'desktop';
  const subtitle =
    expertName?.trim() ||
    (reviewCount === 1 ? '1 opinión verificada' : `${reviewCount} opiniones verificadas`);

  return (
    <header
      className={`sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[#ebebeb] bg-white ${
        isDesktop ? 'px-6 py-4' : 'px-5 py-3'
      }`}
    >
      <div className="min-w-0 pr-3">
        <p className="truncate text-lg font-semibold leading-tight text-[#222222]">Reseñas</p>
        <p className="mt-0.5 truncate text-sm text-[#717171]">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#717171] transition-colors hover:bg-[#f5f5f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#222222]"
        aria-label="Cerrar reseñas"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
    </header>
  );
}

function ReviewsDrawerSummary({
  averageRating,
  reviewCount,
  reviews,
}: {
  averageRating: number;
  reviewCount: number;
  reviews: ServiceReviewItem[];
}) {
  const distribution = useMemo(() => computeReviewRatingDistribution(reviews), [reviews]);
  const showBars = reviewCount >= 3;

  return (
    <div className="sd-reviews-drawer-summary shrink-0 border-b border-[#ebebeb] bg-white px-5 py-3 lg:px-6">
      <ServiceDetailReviewsMobileStatsRow
        averageRating={averageRating}
        reviewCount={reviewCount}
        distribution={distribution}
        showHistogram={showBars}
        neutral
      />
    </div>
  );
}

function ReviewsListBody({
  reviews,
  averageRating,
  expandedReviews,
  onToggleExpand,
  onOpenReviewImage,
  className = '',
}: Pick<
  ServiceDetailReviewsModalProps,
  'reviews' | 'averageRating' | 'expandedReviews' | 'onToggleExpand' | 'onOpenReviewImage'
> & {
  className?: string;
}) {
  return (
    <ServiceDetailReviewsSection
      reviews={reviews}
      averageRating={averageRating}
      expandedReviews={expandedReviews}
      onToggleExpand={onToggleExpand}
      onOpenReviewImage={onOpenReviewImage}
      hideHeading
      headingId="sd-reviews-modal-heading"
      density="drawer"
      className={`!mt-0 !border-t-0 !pt-0 ${className}`}
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
  const handleClose = () => onOpenChange(false);

  if (isMobile) {
    return (
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        drawerMaxHeight="min(92dvh, calc(100dvh - env(safe-area-inset-bottom)))"
        snapPoints={[0.92]}
        drawerClassName="rounded-t-[20px] border-0 shadow-[0_-8px_32px_rgba(0,0,0,0.14)]"
      >
        <div className="flex min-h-0 flex-col bg-white font-display">
          <ReviewsDrawerHeader
            layout="mobile"
            expertName={expertName}
            reviewCount={reviews.length}
            onClose={handleClose}
          />
          {reviews.length > 0 ? (
            <ReviewsDrawerSummary
              averageRating={averageRating}
              reviewCount={reviews.length}
              reviews={reviews}
            />
          ) : null}
          <div
            className={`pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-1 ${SD_MOBILE_GUTTER_CLASS}`}
          >
            <ReviewsListBody
              reviews={reviews}
              averageRating={averageRating}
              expandedReviews={expandedReviews}
              onToggleExpand={onToggleExpand}
              onOpenReviewImage={onOpenReviewImage}
            />
          </div>
        </div>
      </ResponsiveModal>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        overlayClassName="bg-black/40"
        className={DESKTOP_REVIEWS_PANEL_CLASS}
      >
        <DialogTitle className="sr-only">Reseñas</DialogTitle>
        <DialogDescription className="sr-only">
          {reviews.length} opiniones de clientes
        </DialogDescription>

        <ReviewsDrawerHeader
          layout="desktop"
          expertName={expertName}
          reviewCount={reviews.length}
          onClose={handleClose}
        />

        {reviews.length > 0 ? (
          <ReviewsDrawerSummary
            averageRating={averageRating}
            reviewCount={reviews.length}
            reviews={reviews}
          />
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 pb-8 pt-1">
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
